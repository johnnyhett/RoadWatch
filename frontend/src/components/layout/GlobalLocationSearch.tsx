'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Compass, Globe } from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';
import { UserLocation } from '@/types';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

const PRESET_CITIES: { name: string; country: string; lat: number; lng: number }[] = [
  { name: 'Kumasi', country: 'Ghana', lat: 6.6885, lng: -1.6244 },
  { name: 'Accra', country: 'Ghana', lat: 5.5545, lng: -0.1902 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
];

export default function GlobalLocationSearch() {
  const { selectLocation, enableGps, loading: gpsLoading } = useLocationContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || item.display_name.split(',')[0];
    const country = addr.country || item.display_name.split(',').pop()?.trim() || '';

    setQuery(`${city}, ${country}`);
    setIsOpen(false);
    selectLocation({ latitude: lat, longitude: lng, city, country });
  };

  const handleSelectPreset = (preset: typeof PRESET_CITIES[0]) => {
    setQuery(`${preset.name}, ${preset.country}`);
    setIsOpen(false);
    selectLocation({
      latitude: preset.lat,
      longitude: preset.lng,
      city: preset.name,
      country: preset.country,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search any City or Country globally..."
          className="w-full bg-black/60 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs rounded-lg pl-8 pr-20 py-1.5 focus:outline-none transition-all placeholder:text-white/40 shadow-inner"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin mr-1" />}
          <button
            onClick={() => enableGps()}
            disabled={gpsLoading}
            title="Auto-Detect Location (GPS / IP)"
            className="px-2 py-0.5 bg-white/5 text-cyan-300 border border-white/10 rounded text-[10px] font-mono hover:bg-white/10 transition-all flex items-center gap-1"
          >
            <Compass className={`w-3 h-3 text-cyan-400 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Dropdown with Preset Quick Chips + Search Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-lg overflow-hidden z-50 shadow-2xl divide-y divide-white/5 max-h-72 overflow-y-auto">
          {/* Quick Popular Cities */}
          <div className="p-2 bg-white/5">
            <span className="text-[10px] font-mono text-white/50 block mb-1.5 uppercase font-semibold">
              Popular Locations
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESET_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectPreset(c)}
                  className="px-2 py-1 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-white/80 rounded text-[11px] font-mono border border-white/10 transition-all flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Autocomplete Search Results */}
          {results.length > 0 && (
            <div className="divide-y divide-white/5">
              {results.map((item) => {
                const addr = item.address || {};
                const city = addr.city || addr.town || addr.village || addr.county || item.display_name.split(',')[0];

                return (
                  <div
                    key={item.place_id}
                    onClick={() => handleSelectResult(item)}
                    className="px-3 py-2 hover:bg-cyan-500/20 cursor-pointer transition-colors flex items-center gap-2 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-white block truncate">{city}</span>
                      <span className="text-[10px] text-white/50 block truncate font-mono">
                        {item.display_name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
