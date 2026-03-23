import React, { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Ship, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

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

const MarkerWithInfoWindow = ({ position, title, data, type }: { position: { lat: number, lng: number }, title: string, data: any, type: 'lane' | 'vessel' }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker ref={markerRef} position={position} onClick={() => setOpen(true)}>
        {type === 'lane' ? (
          <Pin 
            background={data.congestionLevel > 70 ? "#ef4444" : data.congestionLevel > 40 ? "#f59e0b" : "#10b981"} 
            glyphColor="#fff"
            borderColor="#000"
          />
        ) : (
          <div className="p-1 bg-blue-500 rounded-full border-2 border-white shadow-lg">
            <Ship size={14} className="text-white" />
          </div>
        )}
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 min-w-[200px] text-zinc-900">
            <h3 className="font-bold text-sm mb-1">{title}</h3>
            {type === 'lane' ? (
              <div className="space-y-1">
                <p className="text-xs flex items-center gap-1">
                  <span className="font-semibold">Status:</span> {data.status}
                </p>
                <p className="text-xs flex items-center gap-1">
                  <span className="font-semibold">Congestion:</span> 
                  <span className={cn(
                    "font-bold",
                    data.congestionLevel > 70 ? "text-red-600" : data.congestionLevel > 40 ? "text-amber-600" : "text-emerald-600"
                  )}>{data.congestionLevel}%</span>
                </p>
                <p className="text-xs flex items-center gap-1">
                  <span className="font-semibold">Delay:</span> +{data.delayDays} days
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs"><span className="font-semibold">Type:</span> {data.type}</p>
                <p className="text-xs"><span className="font-semibold">Cargo:</span> {data.cargo}</p>
                <p className="text-xs"><span className="font-semibold">Route:</span> {data.origin} → {data.destination}</p>
                <div className="pt-1">
                  <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${data.progress}%` }} />
                  </div>
                  <p className="text-[10px] text-right mt-0.5">{data.progress}% Complete</p>
                </div>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const ShippingMap: React.FC = () => {
  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-2xl bg-zinc-900/50 border border-zinc-800 p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 w-fit mx-auto">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Google Maps API Key Required</h2>
          <p className="text-sm text-zinc-400">
            To visualize live shipping lanes and vessel traffic, please add your Google Maps API key to the environment variables.
          </p>
          <div className="text-left bg-black/40 p-4 rounded-xl border border-zinc-800 space-y-2">
            <p className="text-xs font-bold uppercase text-zinc-500">Setup Instructions:</p>
            <ol className="text-xs text-zinc-400 list-decimal list-inside space-y-1">
              <li>Open <strong>Settings</strong> (⚙️ gear icon)</li>
              <li>Go to <strong>Secrets</strong></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
              <li>Paste your API key and press Enter</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: 20, lng: 0 }}
          defaultZoom={2}
          mapId="SHIPPING_LOGISTICS_MAP"
          // @ts-ignore - Mandatory for AI Studio Build Mode
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          styles={[
            {
              "elementType": "geometry",
              "stylers": [{ "color": "#212121" }]
            },
            {
              "elementType": "labels.icon",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#757575" }]
            },
            {
              "elementType": "labels.text.stroke",
              "stylers": [{ "color": "#212121" }]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry",
              "stylers": [{ "color": "#757575" }]
            },
            {
              "featureType": "administrative.country",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#9e9e9e" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#000000" }]
            },
            {
              "featureType": "water",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#3d3d3d" }]
            }
          ]}
        >
          {DEFAULT_LANES.map((lane, i) => (
            <MarkerWithInfoWindow 
              key={`lane-${i}`}
              position={{ lat: lane.lat, lng: lane.lng }}
              title={lane.lane}
              data={lane}
              type="lane"
            />
          ))}
          {DEFAULT_VESSELS.map((vessel, i) => (
            <MarkerWithInfoWindow 
              key={`vessel-${i}`}
              position={{ lat: vessel.lat, lng: vessel.lng }}
              title={vessel.name}
              data={vessel}
              type="vessel"
            />
          ))}
        </Map>
      </APIProvider>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 space-y-2 z-10">
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
