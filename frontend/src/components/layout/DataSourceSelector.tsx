'use client';

import { useState } from 'react';
import { Database, ShieldCheck, Check, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DataSource {
  id: string;
  country: string;
  flag: string;
  name: string;
  provider: string;
  records: string;
  license: string;
  badge: string;
}

export const COUNTRY_DATA_SOURCES: { countryGroup: string; flag: string; sources: DataSource[] }[] = [
  {
    countryGroup: 'Ghana',
    flag: '🇬🇭',
    sources: [
      {
        id: 'ghana_nrsa',
        country: 'Ghana',
        flag: '🇬🇭',
        name: 'National Road Safety Authority (NRSA)',
        provider: 'Ministry of Transport / NRSA Ghana',
        records: '1,500 Geotagged Incident Logs',
        license: 'Ghana Open Government Data',
        badge: 'Primary Dataset',
      },
    ],
  },
  {
    countryGroup: 'United Kingdom',
    flag: '🇬🇧',
    sources: [
      {
        id: 'stats19',
        country: 'United Kingdom',
        flag: '🇬🇧',
        name: 'UK STATS19 National Database',
        provider: 'Department for Transport (DfT)',
        records: 'Official DfT STATS19 Open Data',
        license: 'Open Government Licence v3.0',
        badge: 'Official Open Data',
      },
    ],
  },
  {
    countryGroup: 'United States',
    flag: '🇺🇸',
    sources: [
      {
        id: 'nhtsa',
        country: 'United States',
        flag: '🇺🇸',
        name: 'US NHTSA FARS Database',
        provider: 'Federal Highway Administration',
        records: 'FARS Fatality Analysis System',
        license: 'US Public Domain',
        badge: 'Federal Standard',
      },
    ],
  },
  {
    countryGroup: 'Global / Multi-National',
    flag: '🌐',
    sources: [
      {
        id: 'osm_geocoded',
        country: 'Global',
        flag: '🌐',
        name: 'OpenStreetMap & Municipal Telemetry',
        provider: 'OSM Geocoded Telemetry & Municipal Portals',
        records: 'Real-Time Spatial Map Alignment',
        license: 'ODbL License',
        badge: 'Spatial Network',
      },
    ],
  },
];

export default function DataSourceSelector() {
  const [selectedSource, setSelectedSource] = useState<DataSource>(COUNTRY_DATA_SOURCES[0].sources[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 text-xs text-white transition-all font-mono"
      >
        <span className="text-sm">{selectedSource.flag}</span>
        <span className="hidden sm:inline font-semibold">{selectedSource.country}: {selectedSource.name}</span>
        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Card Grouped by Country */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute top-full left-0 mt-2 w-84 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 z-50 shadow-2xl space-y-3 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Data Sources Grouped by Country
              </span>
            </div>

            <div className="space-y-3">
              {COUNTRY_DATA_SOURCES.map((group) => (
                <div key={group.countryGroup} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono border-b border-white/5 pb-1">
                    <span>{group.flag}</span>
                    <span>{group.countryGroup}</span>
                  </div>

                  <div className="space-y-1">
                    {group.sources.map((src) => {
                      const isSelected = src.id === selectedSource.id;
                      return (
                        <div
                          key={src.id}
                          onClick={() => {
                            setSelectedSource(src);
                            setIsOpen(false);
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,212,255,0.15)]'
                              : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-xs font-bold font-heading text-white">{src.name}</strong>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <div className="text-[10px] font-mono space-y-0.5 text-white/60">
                            <p><span className="text-white/40">Provider:</span> {src.provider}</p>
                            <p><span className="text-white/40">Records:</span> {src.records}</p>
                            <p><span className="text-white/40">License:</span> {src.license}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
