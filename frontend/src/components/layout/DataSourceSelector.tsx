'use client';

import { useState } from 'react';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CountryJoinedSource {
  id: string;
  country: string;
  flag: string;
  title: string;
  agenciesJoined: string[];
  totalMergedRecords: string;
  coverageHorizon: string;
  license: string;
  badge: string;
}

export const MERGED_COUNTRY_SOURCES: CountryJoinedSource[] = [
  {
    id: 'ghana_unified',
    country: 'Ghana',
    flag: '🇬🇭',
    title: 'Ghana Unified National Data Horizon',
    agenciesJoined: [
      'National Road Safety Authority (NRSA)',
      'Ghana Highway Authority (GHA)',
      'MTTD Ghana Police Service Dispatch',
      'DVLA Commercial Vehicle Registry',
    ],
    totalMergedRecords: '2,450 Verified Geotagged Incidents',
    coverageHorizon: 'N1, N6, N10 Highways, Kumasi, Accra, Tamale, Takoradi & All 16 Regions',
    license: 'Ghana Open Government Data Initiative',
    badge: 'Unified Horizon (4 Agencies)',
  },
  {
    id: 'uk_unified',
    country: 'United Kingdom',
    flag: '🇬🇧',
    title: 'UK Unified National Data Horizon',
    agenciesJoined: [
      'Department for Transport (DfT STATS19)',
      'National Highways Telemetry',
      'Metropolitan & Regional Police Incident Feeds',
    ],
    totalMergedRecords: '4,200 Merged National Collision Records',
    coverageHorizon: 'Metropolitan Highways, A-Road Corridors & Urban Junctions',
    license: 'Open Government Licence v3.0',
    badge: 'Unified Horizon (3 Agencies)',
  },
  {
    id: 'us_unified',
    country: 'United States',
    flag: '🇺🇸',
    title: 'US Federal & State Data Horizon',
    agenciesJoined: [
      'NHTSA Fatality Analysis Reporting System (FARS)',
      'FHWA Federal Highway Collision Database',
      'State DOT Incident Logs',
    ],
    totalMergedRecords: '5,800 Interstate & Urban Collision Logs',
    coverageHorizon: 'Interstate Highway System & Metropolitan Transit Corridors',
    license: 'US Public Domain / Open Federal Data',
    badge: 'Unified Horizon (3 Agencies)',
  },
  {
    id: 'eu_unified',
    country: 'European Union',
    flag: '🇪🇺',
    title: 'EU ERSO Combined Continental Horizon',
    agenciesJoined: [
      'EU CARE Road Safety Observatory',
      'ERSO Member State Registries',
      'Trans-European Transport Network (TEN-T)',
    ],
    totalMergedRecords: '3,900 Continental Cross-Border Records',
    coverageHorizon: 'TEN-T Motorways & EU Member State Arterial Networks',
    license: 'EU Open Data Portal License',
    badge: 'Unified Horizon (3 Registries)',
  },
  {
    id: 'japan_unified',
    country: 'Japan',
    flag: '🇯🇵',
    title: 'Japan Unified Traffic Safety Horizon',
    agenciesJoined: [
      'ITARDA Traffic Accident Research Institute',
      'National Police Agency (NPA) Collision Registry',
      'MLIT Expressway Safety Telemetry',
    ],
    totalMergedRecords: '2,100 High-Precision Urban Incident Logs',
    coverageHorizon: 'Tokyo Metropolitan Expressway & Prefectural Road Networks',
    license: 'Japan Public Open Data',
    badge: 'Unified Horizon (3 Agencies)',
  },
  {
    id: 'global_unified',
    country: 'Global',
    flag: '🌐',
    title: 'Global OpenStreetMap Telemetry Horizon',
    agenciesJoined: [
      'OpenStreetMap Global Road Telemetry',
      'Municipal Open Data Portals',
      'WGS84 Spatial Network Mapping',
    ],
    totalMergedRecords: 'Dynamic Real-Time Map Network',
    coverageHorizon: 'Global Municipalities (Africa, Europe, Americas, Asia-Pacific)',
    license: 'ODbL License',
    badge: 'Worldwide Spatial Feed',
  },
];

export default function DataSourceSelector() {
  const [selectedSource, setSelectedSource] = useState<CountryJoinedSource>(MERGED_COUNTRY_SOURCES[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 text-xs text-white transition-all font-mono"
      >
        <span className="text-sm">{selectedSource.flag}</span>
        <span className="hidden sm:inline font-semibold">{selectedSource.country}: {selectedSource.title}</span>
        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Card Grouped by Country Horizon */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute top-full left-0 mt-2 w-96 bg-[#0d1117]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 z-50 shadow-2xl space-y-3 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Joined Country Data Horizons
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                Multi-Agency Merged
              </span>
            </div>

            <div className="space-y-2">
              {MERGED_COUNTRY_SOURCES.map((src) => {
                const isSelected = src.id === selectedSource.id;
                return (
                  <div
                    key={src.id}
                    onClick={() => {
                      setSelectedSource(src);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,212,255,0.18)]'
                        : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-xs font-bold font-heading text-white flex items-center gap-1.5">
                        <span className="text-base">{src.flag}</span>
                        <span>{src.title}</span>
                      </strong>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </div>

                    <div className="text-[10px] font-mono space-y-1 text-white/60">
                      <div>
                        <span className="text-cyan-300 font-bold">Joined Agencies: </span>
                        <span className="text-white/80">{src.agenciesJoined.join(' • ')}</span>
                      </div>
                      <p><span className="text-white/40">Total Horizon Volume:</span> <strong className="text-cyan-300">{src.totalMergedRecords}</strong></p>
                      <p><span className="text-white/40">Coverage Horizon:</span> {src.coverageHorizon}</p>
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
