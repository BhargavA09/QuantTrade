import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Ship,
  Anchor,
  AlertTriangle,
  Search,
  Layers,
  Compass,
  Navigation,
  Globe,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  Activity,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import {
  fetchSupplyChainData,
  searchOpenStreetMap,
  SupplyChainResponse,
  Chokepoint,
  MegaPort,
  SupplyChainVessel,
  TradeCorridor,
  GeocodedLocation
} from '../services/api/supplyChainService';

interface ShippingMapProps {
  lanes?: any[];
  vessels?: any[];
  className?: string;
}

type TileTheme = 'dark' | 'osm' | 'satellite';

export const ShippingMap: React.FC<ShippingMapProps> = ({ lanes, vessels, className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const seaMapLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const corridorsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Data states
  const [supplyData, setSupplyData] = useState<SupplyChainResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Interactive controls
  const [tileTheme, setTileTheme] = useState<TileTheme>('dark');
  const [showSeaMap, setShowSeaMap] = useState<boolean>(true);
  const [selectedVesselType, setSelectedVesselType] = useState<string>('all');
  const [showChokepoints, setShowChokepoints] = useState<boolean>(true);
  const [showPorts, setShowPorts] = useState<boolean>(true);
  const [showVessels, setShowVessels] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);

  // Inspection details
  const [selectedItem, setSelectedItem] = useState<{
    type: 'vessel' | 'chokepoint' | 'port';
    data: any;
  } | null>(null);

  // Geocoding search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchPinMarker, setSearchPinMarker] = useState<L.Marker | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load backend Open API data
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await fetchSupplyChainData();
      setSupplyData(data);
    } catch (err) {
      console.error("Error loading supply chain data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize pure Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if container was reused
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      worldCopyJump: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create layer groups
    corridorsLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    // Apply initial base tile layer
    updateBaseTileLayer(tileTheme, map);

    // Force map resize check
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layers when theme or OpenSeaMap toggles
  const updateBaseTileLayer = (theme: TileTheme, map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    let subdomains = "abcd";
    let maxZoom = 19;

    if (theme === 'osm') {
      url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      subdomains = "abc";
    } else if (theme === 'satellite') {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      subdomains = "abc";
    }

    const tileLayer = L.tileLayer(url, {
      subdomains,
      maxZoom,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO / Esri'
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Handle OpenSeaMap Marine Overlay
    if (showSeaMap) {
      if (!seaMapLayerRef.current) {
        seaMapLayerRef.current = L.tileLayer("https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", {
          opacity: 0.85,
          maxZoom: 18,
          zIndex: 400
        });
      }
      if (!map.hasLayer(seaMapLayerRef.current)) {
        seaMapLayerRef.current.addTo(map);
      }
    } else if (seaMapLayerRef.current && map.hasLayer(seaMapLayerRef.current)) {
      map.removeLayer(seaMapLayerRef.current);
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateBaseTileLayer(tileTheme, mapInstanceRef.current);
    }
  }, [tileTheme, showSeaMap]);

  // Handle OpenStreetMap Search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    const results = await searchOpenStreetMap(searchQuery);
    setSearchResults(results);
    setIsSearching(false);

    if (results.length > 0) {
      flyToLocation(results[0].lat, results[0].lng, results[0].name);
    }
  };

  const flyToLocation = (lat: number, lng: number, label: string) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.flyTo([lat, lng], 6, { duration: 1.5 });

    // Remove previous pin if any
    if (searchPinMarker) {
      searchPinMarker.remove();
    }

    const pinIcon = L.divIcon({
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="background: #06b6d4; color: #000; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(6,182,212,0.6); margin-bottom: 4px; border: 1px solid #fff;">
            ${label.split(',')[0]}
          </div>
          <div style="width: 14px; height: 14px; background: #06b6d4; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 14px #06b6d4;"></div>
        </div>
      `,
      className: 'osm-search-pin',
      iconSize: [120, 40],
      iconAnchor: [60, 36]
    });

    const pin = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    setSearchPinMarker(pin);
    setShowSearchResults(false);
  };

  // Render markers and polylines on map whenever data or layer toggles change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current || !corridorsLayerGroupRef.current) return;

    const markersGroup = markersLayerGroupRef.current;
    const corridorsGroup = corridorsLayerGroupRef.current;

    markersGroup.clearLayers();
    corridorsGroup.clearLayers();

    if (!supplyData) return;

    // 1. Render Trade Corridors (Polylines)
    if (showCorridors && supplyData.tradeCorridors) {
      supplyData.tradeCorridors.forEach((corridor) => {
        if (!corridor.waypoints || corridor.waypoints.length < 2) return;

        const isHighRisk = corridor.riskLevel.toLowerCase().includes('high');
        const color = isHighRisk ? '#f43f5e' : '#38bdf8';

        const polyline = L.polyline(corridor.waypoints, {
          color,
          weight: 2.5,
          opacity: 0.7,
          dashArray: '6, 8',
          lineCap: 'round'
        });

        polyline.bindTooltip(`
          <div style="background:#09090b; color:#fff; border:1px solid #27272a; padding:6px 10px; border-radius:8px; font-size:11px;">
            <div style="font-weight:700; color:#38bdf8;">${corridor.name}</div>
            <div style="color:#a1a1aa; margin-top:2px;">Transit: ~${corridor.avgTransitDays} days | Share: ${corridor.volumeSharePct}%</div>
            <div style="color:${isHighRisk ? '#f43f5e' : '#10b981'}; font-weight:600; font-size:10px; margin-top:2px;">Risk: ${corridor.riskLevel}</div>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        corridorsGroup.addLayer(polyline);
      });
    }

    // 2. Render Strategic Chokepoints
    if (showChokepoints && supplyData.chokepoints) {
      supplyData.chokepoints.forEach((choke) => {
        const isCritical = choke.congestionLevel > 70;
        const isModerate = choke.congestionLevel > 40;
        const color = isCritical ? '#f43f5e' : isModerate ? '#f59e0b' : '#10b981';

        const chokeHtml = `
          <div class="relative cursor-pointer group" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #09090b; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color};">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="3"></circle>
                <line x1="12" y1="22" x2="12" y2="8"></line>
                <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
              </svg>
            </div>
            <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); background: rgba(9,9,11,0.85); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; white-space: nowrap; pointer-events: none;">
              ${choke.name.split(' ')[0]}
            </div>
          </div>
        `;

        const chokeIcon = L.divIcon({
          html: chokeHtml,
          className: 'chokepoint-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([choke.lat, choke.lng], { icon: chokeIcon });
        marker.on('click', () => {
          setSelectedItem({ type: 'chokepoint', data: choke });
        });

        marker.bindTooltip(`
          <div style="background:#09090b; color:#fff; border:1px solid #27272a; padding:6px 10px; border-radius:8px; font-size:11px;">
            <div style="font-weight:700;">${choke.name}</div>
            <div style="color:${color}; font-weight:600; margin-top:2px;">Status: ${choke.status} (${choke.congestionLevel}% Congestion)</div>
            <div style="color:#a1a1aa; font-size:10px;">Transit Delay: +${choke.delayDays} days | Risk: ${choke.securityRisk}</div>
          </div>
        `, { offset: [0, -10] });

        markersGroup.addLayer(marker);
      });
    }

    // 3. Render Global Mega Ports
    if (showPorts && supplyData.ports) {
      supplyData.ports.forEach((port) => {
        const portHtml = `
          <div class="cursor-pointer" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 18px; height: 18px; border-radius: 6px; background: #1e1b4b; border: 1.5px solid #818cf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(129,140,248,0.5);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `;

        const portIcon = L.divIcon({
          html: portHtml,
          className: 'port-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([port.lat, port.lng], { icon: portIcon });
        marker.on('click', () => {
          setSelectedItem({ type: 'port', data: port });
        });

        marker.bindTooltip(`
          <div style="background:#09090b; color:#fff; border:1px solid #27272a; padding:6px 10px; border-radius:8px; font-size:11px;">
            <div style="font-weight:700; color:#818cf8;">${port.name}</div>
            <div style="color:#d4d4d8; font-size:10px;">Throughput: ${port.throughputTeu} | Wait: ${port.berthWaitHours}h</div>
          </div>
        `, { offset: [0, -8] });

        markersGroup.addLayer(marker);
      });
    }

    // 4. Render Active Vessels
    if (showVessels && supplyData.vessels) {
      const filteredVessels = selectedVesselType === 'all'
        ? supplyData.vessels
        : supplyData.vessels.filter(v => v.type.toLowerCase().includes(selectedVesselType.toLowerCase()));

      filteredVessels.forEach((vessel) => {
        let typeColor = '#38bdf8'; // Container
        if (vessel.type.toLowerCase().includes('tanker')) typeColor = '#fbbf24';
        if (vessel.type.toLowerCase().includes('bulk')) typeColor = '#34d399';
        if (vessel.type.toLowerCase().includes('gas')) typeColor = '#c084fc';
        if (vessel.type.toLowerCase().includes('ro-ro')) typeColor = '#22d3ee';

        const heading = vessel.heading || 0;

        const vesselHtml = `
          <div class="cursor-pointer group" style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #09090b; border: 2px solid ${typeColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${typeColor}88; transform: rotate(${heading}deg);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="${typeColor}" stroke="none">
                <polygon points="12,2 22,22 12,18 2,22"></polygon>
              </svg>
            </div>
          </div>
        `;

        const vesselIcon = L.divIcon({
          html: vesselHtml,
          className: 'vessel-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([vessel.lat, vessel.lng], { icon: vesselIcon });
        marker.on('click', () => {
          setSelectedItem({ type: 'vessel', data: vessel });
        });

        marker.bindTooltip(`
          <div style="background:#09090b; color:#fff; border:1px solid #27272a; padding:6px 10px; border-radius:8px; font-size:11px;">
            <div style="font-weight:700; color:${typeColor};">${vessel.name} (${vessel.type})</div>
            <div style="color:#d4d4d8; font-size:10px;">${vessel.origin} → ${vessel.destination}</div>
            <div style="color:#a1a1aa; font-size:9px; margin-top:2px;">Speed: ${vessel.speedKnots} kts | Progress: ${vessel.progress}%</div>
          </div>
        `, { offset: [0, -10] });

        markersGroup.addLayer(marker);
      });
    }

  }, [supplyData, showChokepoints, showPorts, showVessels, showCorridors, selectedVesselType]);

  // Quick navigation preset to Chokepoint
  const handleJumpToChokepoint = (choke: Chokepoint) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([choke.lat, choke.lng], 7, { duration: 1.5 });
    setSelectedItem({ type: 'chokepoint', data: choke });
  };

  return (
    <div className={cn(
      "w-full rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 flex flex-col relative transition-all duration-300",
      isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[650px]",
      className
    )}>
      {/* Top Open API Navigation Bar & Search Header */}
      <div className="p-3 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Ship size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Global Supply Chain & Maritime Fleet</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Open API Live
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-2">
                <span>OpenStreetMap & OpenSeaMap AIS Telemetry</span>
                <span className="text-zinc-600">•</span>
                <span>ODbL Open License</span>
              </p>
            </div>
          </div>
        </div>

        {/* OpenStreetMap Nominatim Geocoding Search */}
        <div className="relative flex-1 max-w-md min-w-[240px]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search port, canal, strait, country (e.g. Suez, Rotterdam, Panama)..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-1.5 pl-9 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-8 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                <X size={12} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1 px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-[10px] font-bold transition-all"
            >
              {isSearching ? <RefreshCw size={10} className="animate-spin" /> : 'Fly'}
            </button>
          </form>

          {/* Autocomplete / Geocoding Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
              <div className="p-2 border-b border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase">
                <span>OpenStreetMap Results</span>
                <button onClick={() => setShowSearchResults(false)} className="hover:text-zinc-300">
                  <X size={12} />
                </button>
              </div>
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => flyToLocation(res.lat, res.lng, res.name)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800/60 border-b border-zinc-800/40 flex items-center justify-between group transition-colors"
                >
                  <span className="truncate text-zinc-300 group-hover:text-cyan-400 pr-2">{res.name}</span>
                  <span className="text-[9px] text-zinc-500 uppercase shrink-0 font-mono">
                    {res.lat.toFixed(2)}, {res.lng.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Map Actions & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh Open API Data"
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-700/50"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin text-cyan-400")} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-700/50"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Secondary Controls Bar: Layer toggles & Tile Styles */}
      <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/50 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Tile Theme Selectors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers size={11} /> Basemap:
          </span>
          <button
            onClick={() => setTileTheme('dark')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
              tileTheme === 'dark' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
            )}
          >
            Carto Dark
          </button>
          <button
            onClick={() => setTileTheme('osm')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
              tileTheme === 'osm' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
            )}
          >
            OpenStreetMap
          </button>
          <button
            onClick={() => setTileTheme('satellite')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
              tileTheme === 'satellite' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
            )}
          >
            Satellite
          </button>

          {/* OpenSeaMap Marine Overlay Toggle */}
          <button
            onClick={() => setShowSeaMap(!showSeaMap)}
            className={cn(
              "ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all",
              showSeaMap ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Anchor size={11} />
            OpenSeaMap Buoys & Nautical
          </button>
        </div>

        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Layers:</span>
          <button
            onClick={() => setShowChokepoints(!showChokepoints)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
              showChokepoints ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-zinc-800/40 text-zinc-500"
            )}
          >
            Chokepoints ({supplyData?.chokepoints?.length || 0})
          </button>
          <button
            onClick={() => setShowPorts(!showPorts)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
              showPorts ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" : "bg-zinc-800/40 text-zinc-500"
            )}
          >
            Mega Ports ({supplyData?.ports?.length || 0})
          </button>
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
              showCorridors ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "bg-zinc-800/40 text-zinc-500"
            )}
          >
            Corridors
          </button>
          <button
            onClick={() => setShowVessels(!showVessels)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
              showVessels ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-zinc-800/40 text-zinc-500"
            )}
          >
            Fleet ({supplyData?.vessels?.length || 0})
          </button>
        </div>

        {/* Vessel Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Vessel Type:</span>
          {['all', 'container', 'tanker', 'bulk', 'gas'].map((vType) => (
            <button
              key={vType}
              onClick={() => setSelectedVesselType(vType)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all",
                selectedVesselType === vType ? "bg-white text-zinc-950 font-bold" : "bg-zinc-800/40 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {vType}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Quick Chokepoints Jump Bar */}
      <div className="px-4 py-1.5 bg-zinc-950/90 border-b border-zinc-800/40 flex items-center gap-2 overflow-x-auto text-xs z-10 scrollbar-none">
        <span className="text-[9px] font-black uppercase text-zinc-600 whitespace-nowrap">Chokepoint Radar:</span>
        {supplyData?.chokepoints?.map((choke) => {
          const isCritical = choke.congestionLevel > 70;
          return (
            <button
              key={choke.id}
              onClick={() => handleJumpToChokepoint(choke)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border",
                isCritical 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20" 
                  : choke.congestionLevel > 40
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isCritical ? "bg-rose-400 animate-pulse" : choke.congestionLevel > 40 ? "bg-amber-400" : "bg-emerald-400"
              )} />
              <span>{choke.name}</span>
              <span className="text-[9px] opacity-70">+{choke.delayDays}d</span>
            </button>
          );
        })}
      </div>

      {/* Main Map Canvas Container */}
      <div className="relative flex-1 w-full min-h-[380px] bg-zinc-950 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" style={{ background: '#09090b' }} />

        {/* Live Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <RefreshCw size={28} className="animate-spin text-cyan-400" />
            <p className="text-xs font-bold text-zinc-300 tracking-wider uppercase">Loading Open Maritime Telemetry...</p>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 space-y-2 z-20 pointer-events-auto shadow-2xl max-w-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tactical Legend</p>
            <span className="text-[8px] text-zinc-500 uppercase">Live AIS Stream</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              <span>Fluid Chokepoint</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
              <span>Critical Delay</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shadow-[0_0_6px_#6366f1]" />
              <span>Mega Port Hub</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-2.5 h-0.5 bg-sky-400 border-t border-dashed" />
              <span>Trade Corridor</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Container Vessel</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Crude Tanker</span>
            </div>
          </div>
        </div>

        {/* Selected Item Telemetry Inspector Drawer */}
        {selectedItem && (
          <div className="absolute top-4 right-4 w-84 max-w-[90vw] p-4 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl z-30 space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {selectedItem.type.toUpperCase()} TELEMETRY
                </span>
                <h3 className="text-sm font-black text-white mt-1">
                  {selectedItem.data.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            </div>

            {/* Vessel Specific Card */}
            {selectedItem.type === 'vessel' && (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>Route:</span>
                    <span className="font-bold text-zinc-200">{selectedItem.data.origin} → {selectedItem.data.destination}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Type / Flag:</span>
                    <span className="font-medium text-zinc-200">{selectedItem.data.type} ({selectedItem.data.flag})</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Speed / Heading:</span>
                    <span className="font-mono text-cyan-400">{selectedItem.data.speedKnots} kts @ {selectedItem.data.heading}°</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Est. Cargo Value:</span>
                    <span className="font-bold text-emerald-400">{selectedItem.data.cargoValueUsd || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>ETA:</span>
                    <span className="text-zinc-200 font-bold">{selectedItem.data.eta}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Voyage Progress:</span>
                    <span className="font-bold text-cyan-400">{selectedItem.data.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${selectedItem.data.progress}%` }} />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                  <span className="font-bold text-zinc-300">Cargo: </span>
                  {selectedItem.data.cargo}
                </p>
              </div>
            )}

            {/* Chokepoint Specific Card */}
            {selectedItem.type === 'chokepoint' && (
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Status:</span>
                    <span className={cn(
                      "font-bold",
                      selectedItem.data.congestionLevel > 70 ? "text-rose-400" : "text-amber-400"
                    )}>{selectedItem.data.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Congestion Level:</span>
                    <span className="font-bold text-white">{selectedItem.data.congestionLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Transit Delay:</span>
                    <span className="font-bold text-rose-400">+{selectedItem.data.delayDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Daily Vessels:</span>
                    <span className="font-mono text-zinc-200">{selectedItem.data.dailyVessels} vessels/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Security Risk:</span>
                    <span className="font-bold text-amber-400">{selectedItem.data.securityRisk}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/60">
                  {selectedItem.data.description}
                </p>

                {selectedItem.data.keyCommodities && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Impacted Seaborne Commodities:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.data.keyCommodities.map((c: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mega Port Specific Card */}
            {selectedItem.type === 'port' && (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>Country / Code:</span>
                    <span className="font-bold text-zinc-200">{selectedItem.data.country} ({selectedItem.data.code})</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Annual Throughput:</span>
                    <span className="font-bold text-indigo-400">{selectedItem.data.throughputTeu}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Berth Wait Time:</span>
                    <span className="font-mono text-amber-400">~{selectedItem.data.berthWaitHours} hours</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Status:</span>
                    <span className="font-semibold text-zinc-300">{selectedItem.data.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                    <p className="font-bold text-emerald-400 mb-0.5">Top Exports</p>
                    <p className="text-zinc-400">{selectedItem.data.topExports?.join(', ')}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                    <p className="font-bold text-blue-400 mb-0.5">Top Imports</p>
                    <p className="text-zinc-400">{selectedItem.data.topImports?.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-1 flex gap-2">
              <button
                onClick={() => {
                  if (mapInstanceRef.current && selectedItem.data.lat && selectedItem.data.lng) {
                    mapInstanceRef.current.flyTo([selectedItem.data.lat, selectedItem.data.lng], 8, { duration: 1.2 });
                  }
                }}
                className="flex-1 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Compass size={13} />
                Center Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quantitative Disruption Bar & Equity Correlations */}
      {supplyData?.disruptionIndices && (
        <div className="p-3 bg-zinc-900/90 border-t border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs z-10">
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Baltic Dry Index (BDI)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black text-white">{supplyData.disruptionIndices.balticDryIndex.value}</span>
              <span className="text-[10px] font-bold text-emerald-400">+{supplyData.disruptionIndices.balticDryIndex.changePct}%</span>
            </div>
            <span className="text-[8px] text-zinc-500">{supplyData.disruptionIndices.balticDryIndex.sentiment}</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Container Spot (SCFI)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black text-white">${supplyData.disruptionIndices.scfiContainerSpotIndex.value}</span>
              <span className="text-[10px] font-bold text-rose-400">+{supplyData.disruptionIndices.scfiContainerSpotIndex.changePct}%</span>
            </div>
            <span className="text-[8px] text-zinc-500">$/FEU Asia - Europe / US</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Red Sea Diversion Rate</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black text-amber-400">{supplyData.disruptionIndices.redSeaReroutingRate.pctOfAsiaEuTrafficDiverted}%</span>
              <span className="text-[9px] text-zinc-400">+12-14 days</span>
            </div>
            <span className="text-[8px] text-zinc-500">Cape of Good Hope Detour</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Supply Chain Beta Stocks</span>
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto scrollbar-none">
              {supplyData.correlatedEquities?.slice(0, 4).map((eq) => (
                <span key={eq.ticker} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono font-bold text-cyan-300">
                  {eq.ticker} ({eq.betaToFreight}x)
                </span>
              ))}
            </div>
            <span className="text-[8px] text-zinc-500">Freight Rate Sensitivity</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingMap;
