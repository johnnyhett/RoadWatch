'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '@/lib/constants';
import { Incident, Blackspot, RouteDetails, UserLocation } from '@/types';
import { useUserPreferences } from '@/context/UserPreferencesContext';
import { humanizeFactor, formatMetric, formatScore } from '@/lib/format';
import { Plus, Minus, Crosshair, WifiOff } from 'lucide-react';

/**
 * Keeps Leaflet's cached container size in sync with the DOM.
 *
 * Mount-scoped on purpose: this used to share an effect with the camera, so
 * every fly-to tore down and rebuilt the ResizeObserver and re-ran the
 * settle timers.
 */
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {}
    };

    // Next.js lays out the panels over several frames; re-measure as it settles.
    invalidate();
    const timers = [100, 400, 1000].map((ms) => setTimeout(invalidate, ms));

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(invalidate);
      resizeObserver.observe(container);
    }

    return () => {
      timers.forEach(clearTimeout);
      resizeObserver?.disconnect();
    };
  }, [map]);

  return null;
}

/** Metres below which a requested camera move is treated as already there. */
const FLY_THRESHOLD_M = 25;

/**
 * Animates the camera to `center`, skipping moves that would not visibly
 * change the view (which previously replayed the fly animation on unrelated
 * re-renders).
 */
function MapCameraController({ center, zoom = 14 }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    const [lat, lng] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (lat === 0 && lng === 0) return;

    const target = L.latLng(lat, lng);
    if (map.distance(map.getCenter(), target) < FLY_THRESHOLD_M && map.getZoom() === zoom) {
      return;
    }

    map.flyTo(target, zoom, { animate: true, duration: 1.1, easeLinearity: 0.22 });
  }, [center, zoom, map]);

  return null;
}

/**
 * Toggles the degraded-basemap backdrop on the live container element.
 *
 * react-leaflet builds the container div once and does not re-apply its
 * `className` prop afterwards, so the class has to be set imperatively.
 */
function OfflineBackdrop({ offline }: { offline: boolean }) {
  const map = useMap();

  useEffect(() => {
    const el = map?.getContainer();
    if (!el) return;
    el.classList.toggle('rw-map-offline', offline);
    return () => el.classList.remove('rw-map-offline');
  }, [map, offline]);

  return null;
}

/** Accessible zoom / recentre controls (Leaflet's default set is disabled). */
function MapControls({ home }: { home: [number, number] }) {
  const map = useMap();
  const btn =
    'w-8 h-8 flex items-center justify-center rounded-lg glass-panel text-white/80 hover:text-cyan-300 ' +
    'hover:border-cyan-500/40 transition-all shadow-lg text-sm font-bold focus:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-cyan-400';

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none' }}>
      <div className="leaflet-control flex flex-col gap-1.5" style={{ pointerEvents: 'auto', marginTop: 12, marginRight: 12 }}>
        <button type="button" aria-label="Zoom in" title="Zoom in" className={btn} onClick={() => map.zoomIn()}>
          <Plus className="w-4 h-4" />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" className={btn} onClick={() => map.zoomOut()}>
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Recentre map"
          title="Recentre map"
          className={btn}
          onClick={() => map.flyTo(home, 14, { animate: true, duration: 1.1 })}
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
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

// Clean severity SVG marker icons
const createCustomIcon = (severity: number) => {
  const color = severity === 1 ? '#ef4444' : severity === 2 ? '#f97316' : severity === 3 ? '#eab308' : '#10b981';
  const glow = severity === 1 ? '#ef4444' : severity === 2 ? '#f97316' : 'transparent';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="18" height="18">
      <circle cx="10" cy="10" r="7" fill="${color}" fill-opacity="0.9" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0 0 4px ${glow});"/>
      <circle cx="10" cy="10" r="2.5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -8],
  });
};

// Pulsing User GPS Location Marker
const createUserLocationIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="32" height="32">
      <circle cx="18" cy="18" r="16" fill="#00d4ff" fill-opacity="0.25" stroke="#00d4ff" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="7" fill="#00d4ff" stroke="#ffffff" stroke-width="2.5"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'user-location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
};

interface MapProps {
  incidents?: Incident[];
  blackspots?: Blackspot[];
  safestRoute?: RouteDetails | null;
  fastestRoute?: RouteDetails | null;
  userLocation?: UserLocation | null;
  showHeatmap?: boolean;
  showBlackspots?: boolean;
  showIncidents?: boolean;
  selectedSeverity?: number | null;
  onSelectBlackspot?: (b: Blackspot) => void;
  flyToCoords?: [number, number] | null;
}

export default function AppMap({
  incidents = [],
  blackspots = [],
  safestRoute = null,
  fastestRoute = null,
  userLocation = null,
  showHeatmap = true,
  showBlackspots = true,
  showIncidents = true,
  selectedSeverity = null,
  onSelectBlackspot,
  flyToCoords = null,
}: MapProps) {
  const { themeMode, mapStyle } = useUserPreferences();
  const [tilesOffline, setTilesOffline] = useState(false);

  // A few misses at the edge of a pan are normal; a sustained run with nothing
  // loading means the basemap is genuinely unreachable.
  const tileErrorsRef = useRef(0);
  const handleTileError = useCallback(() => {
    tileErrorsRef.current += 1;
    if (tileErrorsRef.current >= 4) setTilesOffline(true);
  }, []);
  const handleTileLoad = useCallback(() => {
    tileErrorsRef.current = 0;
    setTilesOffline(false);
  }, []);

  // Dynamic Tile URL based on the selected base map / theme.
  const { url: currentTileUrl, attribution: currentAttribution } = useMemo(() => {
    if (mapStyle === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
      };
    }
    if (mapStyle === 'osm_standard') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      };
    }
    if (themeMode === 'light' || mapStyle === 'carto_light') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: MAP_CONFIG.attribution,
      };
    }
    return { url: MAP_CONFIG.tileLayer, attribution: MAP_CONFIG.attribution }; // CartoDB Dark
  }, [themeMode, mapStyle]);

  const homeCenter: [number, number] = useMemo(
    () => (userLocation ? [userLocation.latitude, userLocation.longitude] : MAP_CONFIG.center),
    [userLocation]
  );

  const activeCenter: [number, number] = useMemo(() => {
    if (flyToCoords) return flyToCoords;
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    return MAP_CONFIG.center;
  }, [flyToCoords, userLocation]);

  const filteredIncidents = useMemo(() => {
    if (selectedSeverity) {
      return incidents.filter((i) => i.severity === selectedSeverity);
    }
    return incidents;
  }, [incidents, selectedSeverity]);

  const displayedIncidents = useMemo(() => {
    if (filteredIncidents.length <= 180) return filteredIncidents;
    const step = Math.ceil(filteredIncidents.length / 180);
    return filteredIncidents.filter((_, idx) => idx % step === 0);
  }, [filteredIncidents]);

  return (
    <MapContainer
      center={activeCenter}
      zoom={14}
      minZoom={3}
      maxZoom={19}
      className={`w-full h-full z-0 ${themeMode === 'light' ? 'bg-[#e2e8f0]' : 'bg-[#090d14]'}`}
      zoomControl={false}
    >
      <TileLayer
        key={currentTileUrl}
        url={currentTileUrl}
        attribution={currentAttribution}
        maxZoom={19}
        // Bound on the layer: GridLayer fires these on itself and Leaflet does
        // not propagate them up to the map instance.
        eventHandlers={{
          tileerror: handleTileError,
          tileload: handleTileLoad,
        }}
      />

      {/* Camera, container-size and basemap-health controllers */}
      <MapResizeHandler />
      <OfflineBackdrop offline={tilesOffline} />
      <MapCameraController center={activeCenter} zoom={14} />
      <MapControls home={homeCenter} />

      {/* Basemap outage notice */}
      {tilesOffline && (
        <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: 'none' }}>
          <div
            className="leaflet-control glass-panel rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl max-w-[280px]"
            style={{ pointerEvents: 'auto', marginBottom: 24, marginLeft: 12 }}
            role="status"
          >
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white leading-tight">Basemap tiles unavailable</p>
              <p className="text-[10px] text-white/60 font-mono leading-tight">
                Overlays and analytics remain accurate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Location & Surrounding Area Radius */}
      {userLocation && (
        <>
          <Circle
            center={[userLocation.latitude, userLocation.longitude]}
            radius={userLocation.accuracy || 350}
            pathOptions={{
              fillColor: '#00d4ff',
              fillOpacity: 0.14,
              color: '#00d4ff',
              weight: 1.5,
              dashArray: '4,4',
            }}
          />
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs text-white min-w-[180px]">
                <strong className="text-cyan-400 block font-semibold text-xs">Your Location</strong>
                <p><strong>Area:</strong> {userLocation.city || 'Detected Region'}</p>
                <p><strong>Country:</strong> {userLocation.country || 'Ghana'}</p>
                <p className="font-mono text-[10px] text-white/50 pt-0.5 border-t border-white/10 mt-1">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {/* Layer 1: Risk Heatmap Surface */}
      {showHeatmap &&
        blackspots.map((b) => (
          <Circle
            key={`heatmap-${b.cluster_id}`}
            center={b.center}
            radius={280 + b.incident_count * 20}
            pathOptions={{
              fillColor: '#ef4444',
              fillOpacity: Math.min(0.28, 0.12 + b.risk_score / 250),
              stroke: false,
            }}
          />
        ))}

      {/* Layer 2: High-Risk Cluster Polygons */}
      {showBlackspots &&
        blackspots.map((b) => (
          <Fragment key={`blackspot-${b.cluster_id}`}>
            {b.bounds && b.bounds.length >= 3 && (
              <Polygon
                positions={b.bounds}
                pathOptions={{
                  color: '#00d4ff',
                  weight: 1.5,
                  dashArray: '4, 4',
                  fillColor: '#ef4444',
                  fillOpacity: 0.18,
                }}
                eventHandlers={{
                  click: () => onSelectBlackspot && onSelectBlackspot(b),
                }}
              >
                <Popup>
                  <div className="p-1.5 space-y-2 min-w-[210px] text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="font-bold text-cyan-400">
                        Hotspot #{b.cluster_id + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold text-[11px]">
                        Risk Score {formatScore(b.risk_score)}
                      </span>
                    </div>
                    <div className="space-y-1 text-white/80">
                      <p><strong>Incidents:</strong> {b.incident_count} crashes</p>
                      <p><strong>Avg Severity:</strong> {formatMetric(b.avg_severity)} / 4.0</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(b.primary_factors || {})
                          .slice(0, 3)
                          .map(([factor, cnt]) => (
                            <span key={factor} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-cyan-300 font-mono">
                              {humanizeFactor(factor)}: {cnt}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            )}
          </Fragment>
        ))}

      {/* Layer 3: Safest vs Direct Route Polylines */}
      {safestRoute && safestRoute.path && safestRoute.path.length > 0 && (
        <>
          <Polyline
            positions={safestRoute.path}
            pathOptions={{
              color: '#10b981',
              weight: 5,
              opacity: 0.9,
            }}
          />
          <Marker position={safestRoute.path[0]} icon={createPinIcon('#10b981', 'Origin')}>
            <Popup>
              <span className="font-bold text-emerald-400 text-xs">Start (Origin)</span>
            </Popup>
          </Marker>
          <Marker position={safestRoute.path[safestRoute.path.length - 1]} icon={createPinIcon('#ef4444', 'Destination')}>
            <Popup>
              <span className="font-bold text-red-400 text-xs">Destination</span>
            </Popup>
          </Marker>
        </>
      )}

      {fastestRoute && fastestRoute.path && fastestRoute.path.length > 0 && (
        <Polyline
          positions={fastestRoute.path}
          pathOptions={{
            color: '#ef4444',
            weight: 3.5,
            opacity: 0.8,
            dashArray: '6, 6',
          }}
        />
      )}

      {/* Layer 4: Incident Point Markers */}
      {showIncidents &&
        displayedIncidents.map((incident) => {
          const icon = createCustomIcon(incident.severity);
          const sevLabel =
            incident.severity === 1
              ? 'Fatal'
              : incident.severity === 2
              ? 'Serious'
              : incident.severity === 3
              ? 'Slight'
              : 'Damage Only';

          return (
            <Marker
              key={incident.accident_id}
              position={[incident.latitude, incident.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs text-white/90 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <span className="text-[10px] text-white/50 font-mono">{incident.accident_id.slice(0, 8)}</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        incident.severity === 1
                          ? 'bg-red-500/20 text-red-400'
                          : incident.severity === 2
                          ? 'bg-orange-500/20 text-orange-400'
                          : incident.severity === 3
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {sevLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div><span className="text-white/40">Weather:</span> {humanizeFactor(incident.weather_condition)}</div>
                    <div><span className="text-white/40">Road:</span> {humanizeFactor(incident.road_surface_condition)}</div>
                    <div><span className="text-white/40">Light:</span> {humanizeFactor(incident.light_condition)}</div>
                    <div><span className="text-white/40">Speed:</span> {incident.speed_limit} km/h</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
