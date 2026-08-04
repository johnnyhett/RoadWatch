'use client';

import { useState, useEffect, useRef } from 'react';
import { RouteParams } from '@/types';
import { useLocationContext } from '@/context/LocationContext';
import { MapPin, SlidersHorizontal, Navigation, Compass, Search, Loader2 } from 'lucide-react';
import GlowButton from '../ui/GlowButton';

interface SearchItem {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    suburb?: string;
  };
}

interface RouteFormProps {
  onComputeRoute: (params: RouteParams) => void;
  loading?: boolean;
}

export default function RouteForm({ onComputeRoute, loading = false }: RouteFormProps) {
  const { location, loading: locLoading, enableGps } = useLocationContext();

  const [originQuery, setOriginQuery] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [originResults, setOriginResults] = useState<SearchItem[]>([]);
  const [originSearching, setOriginSearching] = useState(false);
  const [showOriginDrop, setShowOriginDrop] = useState(false);

  const [destQuery, setDestQuery] = useState('');
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [destResults, setDestResults] = useState<SearchItem[]>([]);
  const [destSearching, setDestSearching] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);

  const [beta, setBeta] = useState(0.7); // Safety weight
  const [useGpsOrigin, setUseGpsOrigin] = useState(false);
  const [mode, setMode] = useState<'car' | 'motorcycle' | 'bicycle' | 'pedestrian'>('car');

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Set default initial origin/destination based on current location
  useEffect(() => {
    if (location) {
      const lat = location.latitude;
      const lng = location.longitude;
      setOriginCoords([lat, lng]);
      setOriginQuery(`${location.city}, ${location.country}`);
      
      // Default destination slightly offset (e.g. 2km north-east)
      const destLat = lat + 0.018;
      const destLng = lng + 0.022;
      setDestCoords([destLat, destLng]);
      setDestQuery(`North ${location.city} Route`);
    } else {
      // Default to Kumasi center if location loading
      setOriginCoords([6.6885, -1.6244]);
      setOriginQuery('Kumasi Central, Ghana');
      setDestCoords([6.7050, -1.6050]);
      setDestQuery('KNUST Main Campus, Kumasi');
    }
  }, [location]);

  // Origin Geocoding search
  useEffect(() => {
    if (!originQuery.trim() || useGpsOrigin || originQuery.length < 3) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setOriginSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originQuery)}&limit=4`);
        if (res.ok) {
          const data = await res.json();
          setOriginResults(data);
          setShowOriginDrop(true);
        }
      } catch (e) {}
      setOriginSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [originQuery, useGpsOrigin]);

  // Destination Geocoding search
  useEffect(() => {
    if (!destQuery.trim() || destQuery.length < 3) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setDestSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destQuery)}&limit=4`);
        if (res.ok) {
          const data = await res.json();
          setDestResults(data);
          setShowDestDrop(true);
        }
      } catch (e) {}
      setDestSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [destQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setShowOriginDrop(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseGps = () => {
    if (!location) {
      enableGps();
    }
    if (location) {
      setOriginCoords([location.latitude, location.longitude]);
      setOriginQuery(`${location.city}, ${location.country}`);
      setUseGpsOrigin(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originCoords || !destCoords) return;

    onComputeRoute({
      origin: originCoords,
      destination: destCoords,
      alpha: 1 - beta,
      beta,
      mode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-4 space-y-4 bg-[#0d1117]/90 border-white/15">
      {/* Travel Mode Selector */}
      <div className="space-y-1">
        <label className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider block font-mono">
          Multi-Modal Transport Mode
        </label>
        <div className="grid grid-cols-4 gap-1 text-xs">
          {[
            { id: 'car', label: '🚗 Car' },
            { id: 'motorcycle', label: '🏍️ Moto' },
            { id: 'bicycle', label: '🚲 Bike' },
            { id: 'pedestrian', label: '🚶 Walk' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as any)}
              className={`py-1.5 rounded-lg text-[11px] font-mono transition-all border ${
                mode === m.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-[0_0_8px_rgba(0,212,255,0.2)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {/* Origin Search */}
        <div ref={originRef} className="space-y-1 relative">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5" /> Start Location (Origin)
            </label>
            <button
              type="button"
              onClick={handleUseGps}
              className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1 transition-colors ${
                useGpsOrigin && location
                  ? 'bg-cyan-500 text-white font-bold'
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              <Compass className={`w-3 h-3 ${locLoading ? 'animate-spin' : ''}`} />
              {useGpsOrigin && location ? 'GPS Active' : 'Use Current Location'}
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                setUseGpsOrigin(false);
              }}
              onFocus={() => originResults.length > 0 && setShowOriginDrop(true)}
              placeholder="Search start address or location..."
              className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-7 py-2 text-white text-xs focus:outline-none focus:border-cyan-400 font-sans"
            />
            {originSearching && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5" />}
          </div>

          {showOriginDrop && originResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-lg overflow-hidden z-50 shadow-2xl divide-y divide-white/5">
              {originResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setOriginCoords([parseFloat(item.lat), parseFloat(item.lon)]);
                    setOriginQuery(item.display_name.split(',')[0]);
                    setShowOriginDrop(false);
                  }}
                  className="p-2 hover:bg-cyan-500/20 cursor-pointer text-xs text-white/90 truncate"
                >
                  <span className="font-semibold block truncate">{item.display_name.split(',')[0]}</span>
                  <span className="text-[10px] text-white/40 block truncate font-mono">{item.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination Search */}
        <div ref={destRef} className="space-y-1 relative">
          <label className="text-[10px] text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <MapPin className="w-3.5 h-3.5" /> Destination
          </label>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={destQuery}
              onChange={(e) => setDestQuery(e.target.value)}
              onFocus={() => destResults.length > 0 && setShowDestDrop(true)}
              placeholder="Search destination address..."
              className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-7 py-2 text-white text-xs focus:outline-none focus:border-cyan-400 font-sans"
            />
            {destSearching && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5" />}
          </div>

          {showDestDrop && destResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-lg overflow-hidden z-50 shadow-2xl divide-y divide-white/5">
              {destResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setDestCoords([parseFloat(item.lat), parseFloat(item.lon)]);
                    setDestQuery(item.display_name.split(',')[0]);
                    setShowDestDrop(false);
                  }}
                  className="p-2 hover:bg-cyan-500/20 cursor-pointer text-xs text-white/90 truncate"
                >
                  <span className="font-semibold block truncate">{item.display_name.split(',')[0]}</span>
                  <span className="text-[10px] text-white/40 block truncate font-mono">{item.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Safety Preference Slider */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70 flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Route Preference
          </span>
          <span className="text-white/90 font-mono text-xs font-semibold">
            Safety {Math.round(beta * 100)}% / Speed {Math.round((1 - beta) * 100)}%
          </span>
        </div>

        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.05"
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-white/50">
          <span className="text-emerald-400">Safest Route</span>
          <span className="text-cyan-400 font-medium">Direct Route</span>
        </div>
      </div>

      <GlowButton type="submit" disabled={loading} className="w-full py-2.5 text-xs font-semibold">
        <Navigation className="w-4 h-4" />
        {loading ? 'Calculating route...' : 'Calculate Route Options'}
      </GlowButton>
    </form>
  );
}

