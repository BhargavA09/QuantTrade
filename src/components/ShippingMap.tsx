import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Ship, Anchor, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix Leaflet default icon issues
import 'leaflet/dist/leaflet.css';

interface ShippingLane {
  lane: string;
  status: string;
  congestionLevel: number;
  delayDays: number;
  lat: number;
  lng: number;
}

interface Vessel {
  name: string;
  type: string;
  status: string;
  origin: string;
  destination: string;
  progress: number;
  lat: number;
  lng: number;
  cargo: string;
}

const DEFAULT_LANES: ShippingLane[] = [
  { lane: "Suez Canal", status: "Clear", congestionLevel: 15, delayDays: 0, lat: 30.5852, lng: 32.2654 },
  { lane: "Panama Canal", status: "Moderate Congestion", congestionLevel: 45, delayDays: 2, lat: 9.1012, lng: -79.5932 },
  { lane: "Strait of Malacca", status: "Clear", congestionLevel: 12, delayDays: 0, lat: 2.2, lng: 102.2 },
  { lane: "English Channel", status: "High Traffic", congestionLevel: 65, delayDays: 1, lat: 50.4, lng: -0.8 },
  { lane: "South China Sea", status: "Heavy Congestion", congestionLevel: 82, delayDays: 4, lat: 12.0, lng: 113.0 },
];

const DEFAULT_VESSELS: Vessel[] = [
  { name: "Ever Given II", type: "Container", status: "In Transit", origin: "Shanghai", destination: "Rotterdam", progress: 65, lat: 15.0, lng: 60.0, cargo: "Electronics" },
  { name: "Ocean Titan", type: "Bulk Carrier", status: "Delayed", origin: "Santos", destination: "Qingdao", progress: 42, lat: -20.0, lng: -10.0, cargo: "Iron Ore" },
  { name: "Global Voyager", type: "Tanker", status: "In Transit", origin: "Ras Tanura", destination: "Ulsan", progress: 88, lat: 10.0, lng: 105.0, cargo: "Crude Oil" },
];

// Custom icons using Lucide
const createLaneIcon = (congestionLevel: number) => {
  const color = congestionLevel > 70 ? "#ef4444" : congestionLevel > 40 ? "#f59e0b" : "#10b981";
  const html = renderToStaticMarkup(
    <div style={{ 
      backgroundColor: color, 
      borderRadius: '50%', 
      width: '24px', 
      height: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }}>
      <Anchor size={14} color="white" />
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-lane-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createVesselIcon = () => {
  const html = renderToStaticMarkup(
    <div style={{ 
      backgroundColor: '#3b82f6', 
      borderRadius: '50%', 
      width: '24px', 
      height: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }}>
      <Ship size={14} color="white" />
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-vessel-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const ShippingMap: React.FC<{ lanes?: ShippingLane[], vessels?: Vessel[] }> = ({ lanes, vessels }) => {
  const displayLanes = lanes && lanes.length > 0 ? lanes : DEFAULT_LANES;
  const displayVessels = vessels && vessels.length > 0 ? vessels : DEFAULT_VESSELS;

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative z-0">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: '100%', width: '100%', background: '#09090b' }}
        scrollWheelZoom={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        
        {displayLanes.map((lane, i) => (
          <Marker 
            key={`lane-${i}`} 
            position={[lane.lat || 0, lane.lng || 0]} 
            icon={createLaneIcon(lane.congestionLevel)}
          >
            <Popup>
              <div className="p-1 min-w-[180px] text-zinc-900">
                <h3 className="font-bold text-sm mb-1">{lane.lane}</h3>
                <div className="space-y-1">
                  <p className="text-xs flex items-center gap-1">
                    <span className="font-semibold">Status:</span> {lane.status}
                  </p>
                  <p className="text-xs flex items-center gap-1">
                    <span className="font-semibold">Congestion:</span> 
                    <span className={cn(
                      "font-bold",
                      lane.congestionLevel > 70 ? "text-red-600" : lane.congestionLevel > 40 ? "text-amber-600" : "text-emerald-600"
                    )}>{lane.congestionLevel}%</span>
                  </p>
                  <p className="text-xs flex items-center gap-1">
                    <span className="font-semibold">Delay:</span> +{lane.delayDays} days
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {displayVessels.map((vessel, i) => (
          <Marker 
            key={`vessel-${i}`} 
            position={[vessel.lat || 0, vessel.lng || 0]} 
            icon={createVesselIcon()}
          >
            <Popup>
              <div className="p-1 min-w-[180px] text-zinc-900">
                <h3 className="font-bold text-sm mb-1">{vessel.name}</h3>
                <div className="space-y-1">
                  <p className="text-xs"><span className="font-semibold">Type:</span> {vessel.type}</p>
                  <p className="text-xs"><span className="font-semibold">Cargo:</span> {vessel.cargo}</p>
                  <p className="text-xs"><span className="font-semibold">Route:</span> {vessel.origin} → {vessel.destination}</p>
                  <div className="pt-1">
                    <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${vessel.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-right mt-0.5">{vessel.progress}% Complete</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 space-y-2 z-[1000]">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Map Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-zinc-300">Clear Lane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-zinc-300">Moderate Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] text-zinc-300">Heavy Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-zinc-300">Active Vessel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
