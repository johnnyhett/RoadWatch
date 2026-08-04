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

// Multi-Continent Global City Presets
const CONTINENT_CITIES: { region: string; cities: { name: string; country: string; lat: number; lng: number }[] }[] = [
  {
    region: '🌍 Africa',
    cities: [
      { name: 'Kumasi', country: 'Ghana', lat: 6.6885, lng: -1.6244 },
      { name: 'Accra', country: 'Ghana', lat: 5.5545, lng: -0.1902 },
      { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
      { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
      { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
    ],
  },
  {
    region: '🇪🇺 Europe',
    cities: [
      { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
      { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
      { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
      { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    ],
  },
  {
    region: '🌎 Americas',
    cities: [
      { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
      { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
      { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
    ],
  },
  {
    region: '🌏 Asia & Pacific',
    cities: [
      { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
      { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
      { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    ],
  },
];

export default function GlobalLocationSearch() {
  const { selectLocation, enableGps, loading: gpsLoading } = useLocationContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding search across ALL countries globally
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

  const handleSelectPreset = (c: { name: string; country: string; lat: number; lng: number }) => {
    setQuery(`${c.name}, ${c.country}`);
    setIsOpen(false);
    selectLocation({
      latitude: c.lat,
      longitude: c.lng,
      city: c.name,
      country: c.country,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search ANY City or Country globally (Africa, Europe, Asia, Americas)..."
          className="w-full bg-black/60 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs rounded-xl pl-8 pr-20 py-1.5 focus:outline-none transition-all placeholder:text-white/40 shadow-inner"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin mr-1" />}
          <button
            onClick={() => enableGps()}
            disabled={gpsLoading}
            title="Auto-Detect Location (GPS / IP)"
            className="px-2 py-0.5 bg-white/5 text-cyan-300 border border-white/10 rounded-md text-[10px] font-mono hover:bg-white/10 transition-all flex items-center gap-1"
          >
            <Compass className={`w-3 h-3 text-cyan-400 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Multi-Continent Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-xl overflow-hidden z-50 shadow-2xl divide-y divide-white/5 max-h-80 overflow-y-auto">
          {/* Multi-Continent Quick Chips */}
          <div className="p-2.5 space-y-2 bg-white/[0.02]">
            {CONTINENT_CITIES.map((reg) => (
              <div key={reg.region} className="space-y-1">
                <span className="text-[10px] font-mono text-white/50 block font-semibold uppercase">
                  {reg.region}
                </span>
                <div className="flex flex-wrap gap-1">
                  {reg.cities.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleSelectPreset(c)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-white/80 rounded text-[10px] font-mono border border-white/10 transition-all flex items-center gap-1"
                    >
                      <Globe className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Autocomplete Search Results */}
          {results.length > 0 && (
            <div className="divide-y divide-white/5">
              <span className="text-[10px] font-mono text-white/40 block px-3 py-1.5 bg-white/5 uppercase">
                Global Search Results
              </span>
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
