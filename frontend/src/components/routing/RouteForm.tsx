'use client';

import { useState } from 'react';
import { RouteParams } from '@/types';
import { useLocation } from '@/hooks/useLocation';
import { MapPin, SlidersHorizontal, Navigation, Compass, Globe } from 'lucide-react';
import GlowButton from '../ui/GlowButton';

const LOCATIONS: Record<string, [number, number]> = {
  'Westminster Station': [51.5013, -0.1248],
  'Piccadilly Circus': [51.5100, -0.1344],
  'Tower of London': [51.5081, -0.0759],
  'Oxford Circus Junction': [51.5155, -0.1419],
  'Victoria Station': [51.4952, -0.1439],
  'Camden Town': [51.5390, -0.1426],
};

interface RouteFormProps {
  onComputeRoute: (params: RouteParams) => void;
  loading?: boolean;
}

export default function RouteForm({ onComputeRoute, loading = false }: RouteFormProps) {
  const { location, loading: locLoading, enableLocation } = useLocation();
  const [useGpsOrigin, setUseGpsOrigin] = useState(false);
  const [originName, setOriginName] = useState('Westminster Station');
  const [destName, setDestName] = useState('Oxford Circus Junction');
  const [beta, setBeta] = useState(0.7); // Safety weight

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const origin: [number, number] = useGpsOrigin && location
      ? [location.latitude, location.longitude]
      : LOCATIONS[originName] || [51.5013, -0.1248];

    const destination = LOCATIONS[destName] || [51.5155, -0.1419];
    onComputeRoute({
      origin,
      destination,
      alpha: 1 - beta,
      beta,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
      <div className="space-y-3">
        {/* Origin Selector */}
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Start Location
            </label>
            <button
              type="button"
              onClick={() => {
                if (!location) enableLocation();
                setUseGpsOrigin(!useGpsOrigin);
              }}
              className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                useGpsOrigin && location
                  ? 'bg-cyan-500 text-white font-bold'
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              <Compass className={`w-3 h-3 ${locLoading ? 'animate-spin' : ''}`} />
              {useGpsOrigin && location ? 'Current Location Active' : 'Use Current Location'}
            </button>
          </div>

          {useGpsOrigin && location ? (
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/90 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block">{location.city}, {location.country}</span>
              </div>
            </div>
          ) : (
            <select
              value={originName}
              onChange={(e) => setOriginName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {Object.keys(LOCATIONS).map((loc) => (
                <option key={loc} value={loc} className="bg-[#0a0a0f] text-white">
                  {loc}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Destination Selector */}
        <div className="space-y-1">
          <label className="text-[10px] text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Destination
          </label>
          <select
            value={destName}
            onChange={(e) => setDestName(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
          >
            {Object.keys(LOCATIONS).map((loc) => (
              <option key={loc} value={loc} className="bg-[#0a0a0f] text-white">
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optimization Weight Slider */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70 flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Route Preference
          </span>
          <span className="text-white/90 font-semibold">
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
        <div className="flex justify-between text-[10px] text-white/50">
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
