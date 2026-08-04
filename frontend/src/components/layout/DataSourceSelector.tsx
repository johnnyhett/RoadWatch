'use client';

import { useState } from 'react';
import { Database, ShieldCheck, Check, Server, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DataSource {
  id: string;
  name: string;
  provider: string;
  coverage: string;
  records: string;
  license: string;
  schema: string;
  badge: string;
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'stats19',
    name: 'UK STATS19 Open Data',
    provider: 'Department for Transport (DfT)',
    coverage: 'Metropolitan Road Networks',
    records: '1,500 Verified Incidents',
    license: 'Open Government Licence v3.0',
    schema: 'STATS19 Official Road Safety Schema',
    badge: 'Official Open Data',
  },
  {
    id: 'nhtsa',
    name: 'US NHTSA FARS Database',
    provider: 'Federal Highway Administration',
    coverage: 'Urban & Interstate Highway System',
    records: '2,200 Federal Collision Records',
    license: 'US Public Domain',
    schema: 'FARS Highway Fatality Standard',
    badge: 'Federal Database',
  },
  {
    id: 'osm_geocoded',
    name: 'Global OSM Geocoded Feed',
    provider: 'OpenStreetMap & Municipal Authorities',
    coverage: 'Global Municipalities (Accra, Kumasi, London, Lagos)',
    records: 'Real-Time Spatial Map Telemetry',
    license: 'ODbL Open Database License',
    schema: 'WGS84 Spatial Road Alignment',
    badge: 'Real-Time Telemetry',
  },
];

export default function DataSourceSelector() {
  const [selectedSource, setSelectedSource] = useState<DataSource>(DATA_SOURCES[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-white/10 text-xs text-white/80 transition-all font-mono"
      >
        <Database className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline font-semibold">{selectedSource.name}</span>
        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
          {selectedSource.badge}
        </span>
        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Modal / Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute top-full right-0 mt-2 w-80 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 z-50 shadow-2xl space-y-2"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Verified Data Sources
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">OGL v3.0 Compliant</span>
            </div>

            <div className="space-y-1.5">
              {DATA_SOURCES.map((src) => {
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
                        ? 'bg-cyan-500/15 border-cyan-400 text-white'
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
