'use client';

import { motion } from 'framer-motion';
import { Blackspot } from '@/types';
import { X, AlertTriangle, ShieldCheck, Activity, MapPin, Zap } from 'lucide-react';

interface BlackspotDrawerProps {
  blackspot: Blackspot | null;
  onClose: () => void;
}

export default function BlackspotDrawer({ blackspot, onClose }: BlackspotDrawerProps) {
  if (!blackspot) return null;

  const primaryFactors = Object.entries(blackspot.primary_factors || {}).sort((a, b) => b[1] - a[1]);
  const topFactor = primaryFactors[0]?.[0] || 'Speeding';

  // Compute targeted recommendations based on primary factor
  const getRecommendations = (factor: string) => {
    if (factor.includes('Speeding')) {
      return ['Deploy automated speed enforcement cameras', 'Lower speed limit by 10 mph', 'Install speed humps or traffic calming chicanes'];
    }
    if (factor.includes('Lighting') || factor.includes('Darkness')) {
      return ['Upgrade street lighting to high-lumen LEDs', 'Add illuminated crosswalk signage', 'Improve reflective road surface markings'];
    }
    if (factor.includes('Rain') || factor.includes('Weather') || factor.includes('Wet')) {
      return ['Apply high-friction anti-skid road surfacing', 'Improve storm drain capacity to eliminate ponding', 'Install variable message signs warning of wet hazards'];
    }
    if (factor.includes('Drink_Driving')) {
      return ['Increase police sobriety checkpoints', 'Enhance street lighting near nightlife venues', 'Implement targeted public safety campaigns'];
    }
    return ['Redesign intersection layout and turning lanes', 'Audit traffic signal clearance intervals', 'Add high-visibility pedestrian refuge islands'];
  };

  const recommendations = getRecommendations(topFactor);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-[420px] bg-[#0a0a0f]/95 backdrop-blur-3xl border-l border-white/10 p-6 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
    >
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Hotspot #{blackspot.cluster_id + 1}
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              RISK {blackspot.risk_score}
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

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {/* Core Metrics */}
        <div className="glass-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-white/50 block mb-1">Total Crashes</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {blackspot.incident_count}
              </span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-white/50 block mb-1">Avg Severity</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {blackspot.avg_severity} / 4.0
              </span>
            </div>
          </div>
        </div>

        {/* Contributing Factors Frequency Breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Factor Co-Occurrence Frequency
          </h4>

          <div className="space-y-2">
            {primaryFactors.slice(0, 5).map(([factor, count]) => {
              const pct = Math.round((count / blackspot.incident_count) * 100);
              return (
                <div key={factor} className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-white/80 font-medium">{factor}</span>
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

        {/* Actionable Engineering Mitigation Recommendations */}
        <div>
          <h4 className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Actionable Safety Recommendations
          </h4>

          <div className="glass-card p-4 bg-emerald-500/5 border-emerald-500/20 space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
