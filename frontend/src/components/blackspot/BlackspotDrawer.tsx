'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { humanizeFactor, formatMetric, formatScore } from '@/lib/format';
import { Blackspot } from '@/types';
import { X, Activity, MapPin, Zap, Download, Wrench } from 'lucide-react';

interface BlackspotDrawerProps {
  blackspot: Blackspot | null;
  onClose: () => void;
}

interface Countermeasure {
  category: 'Geometric' | 'Surface' | 'Lighting' | 'Signal' | 'Enforcement';
  title: string;
  description: string;
  crf: number; // Crash Reduction Factor %
  cost: 'Low' | 'Medium' | 'High';
}

export default function BlackspotDrawer({ blackspot, onClose }: BlackspotDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!blackspot) return null;

  const primaryFactors = Object.entries(blackspot.primary_factors || {}).sort((a, b) => b[1] - a[1]);

  // Comprehensive Actionable Civil & Traffic Engineering Countermeasures
  const allCountermeasures: Countermeasure[] = [
    {
      category: 'Surface',
      title: 'High-Friction Anti-Skid Surfacing (HFST)',
      description: 'Apply calcined bauxite resin surface treatment to restore macro-texture friction in high-braking zone.',
      crf: 38,
      cost: 'Medium',
    },
    {
      category: 'Enforcement',
      title: 'Automated Speed Enforcement Corridor',
      description: 'Deploy fixed point-to-point average speed cameras and digital variable speed limit displays.',
      crf: 35,
      cost: 'High',
    },
    {
      category: 'Lighting',
      title: 'High-Lumen LED Luminaire Retrofit',
      description: 'Upgrade existing streetlights to 4000K neutral white LEDs and illuminate crosswalk approaches.',
      crf: 28,
      cost: 'Low',
    },
    {
      category: 'Geometric',
      title: 'Roundabout Canalization & Lane Chicanes',
      description: 'Reconfigure entry deflection angles to slow approach speeds and eliminate right-angle collision vectors.',
      crf: 42,
      cost: 'High',
    },
    {
      category: 'Signal',
      title: 'Traffic Signal Retiming & All-Red Phase',
      description: 'Audit signal clearance intervals and introduce micro-all-red safety buffers during peak hours.',
      crf: 24,
      cost: 'Low',
    },
    {
      category: 'Geometric',
      title: 'High-Visibility Pedestrian Refuge Island',
      description: 'Install raised mid-street refuge median with bollards and tactile warning pavings.',
      crf: 46,
      cost: 'Medium',
    },
  ];

  const filteredCountermeasures = selectedCategory === 'All'
    ? allCountermeasures
    : allCountermeasures.filter((c) => c.category === selectedCategory);

  const handleExportBrief = () => {
    const textContent = `
ROADSAFETY BLACKSPOT ENGINEERING INTERVENTION BRIEF
==================================================
Hotspot ID: #${blackspot.cluster_id + 1}
Risk Score: ${formatScore(blackspot.risk_score)} / 100
Coordinates: ${blackspot.center[0]}, ${blackspot.center[1]}
Total Incidents: ${blackspot.incident_count}
Average Severity: ${formatMetric(blackspot.avg_severity)} / 4.0

PRIMARY RISK FACTORS:
${primaryFactors.map(([f, c]) => `- ${humanizeFactor(f)}: ${c} occurrences`).join('\n')}

ACTIONABLE COUNTERMEASURES:
${allCountermeasures.map((c) => `[${c.category.toUpperCase()}] ${c.title} (CRF: ${c.crf}%, Cost: ${c.cost})\n  ${c.description}`).join('\n\n')}
`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Blackspot_Intervention_Brief_Hotspot_${blackspot.cluster_id + 1}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] max-w-full bg-[#0a0a0f]/95 backdrop-blur-3xl border-l border-white/10 p-6 z-40 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
    >
      {/* Drawer Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-heading">
              Hotspot #{blackspot.cluster_id + 1}
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              RISK {formatScore(blackspot.risk_score)}
            </span>
          </div>
          <p className="text-xs text-white/50 flex items-center gap-1 mt-1 font-mono">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {blackspot.center[0].toFixed(4)}, {blackspot.center[1].toFixed(4)}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {/* Core Metrics */}
        <div className="glass-card p-4 space-y-3 bg-white/5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-white/50 block mb-0.5 font-mono">Total Crashes</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {blackspot.incident_count}
              </span>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-white/50 block mb-0.5 font-mono">Avg Severity</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {formatMetric(blackspot.avg_severity)} / 4.0
              </span>
            </div>
          </div>
        </div>

        {/* Contributing Factors Frequency Breakdown */}
        <div>
          <h4 className="text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider flex items-center gap-2 font-heading">
            <Activity className="w-4 h-4 text-cyan-400" /> Primary Crash Risk Drivers
          </h4>

          <div className="space-y-2">
            {primaryFactors.slice(0, 4).map(([factor, count]) => {
              const pct = Math.round((count / blackspot.incident_count) * 100);
              return (
                <div key={factor} className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-white/80 font-medium">{humanizeFactor(factor)}</span>
                    <span className="font-mono text-cyan-400 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Engineering Mitigation Countermeasures */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2 font-heading">
              <Wrench className="w-4 h-4 text-emerald-400" /> Engineering Countermeasures
            </h4>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1 mb-3 text-[10px] font-mono">
            {['All', 'Surface', 'Geometric', 'Lighting', 'Signal', 'Enforcement'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredCountermeasures.map((c, i) => (
              <div key={i} className="glass-card p-3 bg-emerald-500/5 border-emerald-500/20 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {c.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    CRF: -{c.crf}%
                  </span>
                </div>
                <p className="text-xs text-white/70">{c.description}</p>
                <div className="flex justify-between text-[10px] font-mono text-white/40 pt-1 border-t border-white/5">
                  <span>Category: <strong className="text-white/70">{c.category}</strong></span>
                  <span>Cost Tier: <strong className="text-cyan-400">{c.cost}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Brief Export Button */}
      <div className="pt-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleExportBrief}
          className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Countermeasure Brief</span>
        </button>
      </div>
    </motion.div>
  );
}

