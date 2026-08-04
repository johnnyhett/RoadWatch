'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CONFIG } from '@/lib/constants';
import { RouteDetails, Blackspot } from '@/types';

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

const createPinIcon = (color: string, label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-route-pin',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -28],
  });
};

interface RouteMapProps {
  safestRoute?: RouteDetails | null;
  fastestRoute?: RouteDetails | null;
  blackspots?: Blackspot[];
  center?: [number, number];
}

export default function RouteMap({
  safestRoute = null,
  fastestRoute = null,
  blackspots = [],
  center = [6.6885, -1.6244],
}: RouteMapProps) {
  const mapCenter = safestRoute?.path?.[0] || center;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url={MAP_CONFIG.tileLayer}
          attribution={MAP_CONFIG.attribution}
        />

        <MapController center={mapCenter} zoom={13} />

        {/* Blackspot Risk Surface Areas */}
        {blackspots.map((b) => (
          <Circle
            key={`b-${b.cluster_id}`}
            center={b.center}
            radius={300 + b.incident_count * 20}
            pathOptions={{
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              stroke: false,
            }}
          />
        ))}

        {/* Direct / Fastest Route Polyline */}
        {fastestRoute && fastestRoute.path && fastestRoute.path.length > 0 && (
          <Polyline
            positions={fastestRoute.path}
            pathOptions={{
              color: '#ef4444',
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* Safest Route Polyline */}
        {safestRoute && safestRoute.path && safestRoute.path.length > 0 && (
          <>
            <Polyline
              positions={safestRoute.path}
              pathOptions={{
                color: '#10b981',
                weight: 6,
                opacity: 0.95,
              }}
            />
            <Marker position={safestRoute.path[0]} icon={createPinIcon('#10b981', 'Origin')}>
              <Popup>
                <span className="font-bold text-emerald-400 text-xs">Origin</span>
              </Popup>
            </Marker>
            <Marker position={safestRoute.path[safestRoute.path.length - 1]} icon={createPinIcon('#ef4444', 'Destination')}>
              <Popup>
                <span className="font-bold text-red-400 text-xs">Destination</span>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Sleek Non-Overlapping Route Legend Overlay */}
      <div className="absolute bottom-4 right-4 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 p-3 rounded-xl z-10 text-xs shadow-2xl space-y-2 max-w-xs">
        <h4 className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider">
          Route Safety Legend
        </h4>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded bg-emerald-500 shrink-0" />
            <span className="text-emerald-300 font-semibold">Safest Route (Min Risk)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded bg-red-500 border border-dashed border-red-300 shrink-0" />
            <span className="text-red-300 font-semibold">Direct Route (High Risk)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50 shrink-0" />
            <span className="text-white/70">Crash Hotspot Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
}
