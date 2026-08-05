'use client';

import { Blackspot } from '@/types';
import { Target, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { humanizeFactor, formatMetric, formatScore } from '@/lib/format';

interface BlackspotListProps {
  blackspots: Blackspot[];
  selectedBlackspotId?: number | null;
  onSelectBlackspot: (b: Blackspot) => void;
}

export default function BlackspotList({
  blackspots,
  selectedBlackspotId,
  onSelectBlackspot,
}: BlackspotListProps) {
  if (!blackspots || blackspots.length === 0) {
    return (
      <div className="glass-card p-4 text-center text-white/50 text-xs font-mono">
        <Target className="w-6 h-6 mx-auto mb-2 opacity-40 animate-pulse text-cyan-400" />
        Mining Spatial Blackspots...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1.5">
      {blackspots.map((spot, index) => {
        const isSelected = selectedBlackspotId === spot.cluster_id;
        const topFactor = humanizeFactor(Object.keys(spot.primary_factors || {})[0]) || 'High Density';

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={spot.cluster_id}
            onClick={() => onSelectBlackspot(spot)}
            className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
              isSelected
                ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`p-2 rounded-lg ${
                  spot.risk_score > 100
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : spot.risk_score > 50
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors font-heading whitespace-nowrap">
                    Hotspot #{spot.cluster_id + 1}
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 whitespace-nowrap shrink-0">
                    {spot.incident_count} crashes
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5 min-w-0">
                  <span className="text-[10px] text-white/50 truncate" title={topFactor}>Primary: {topFactor}</span>
                  <span className="text-[10px] text-white/40 font-mono whitespace-nowrap shrink-0">Sev: {formatMetric(spot.avg_severity)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block font-mono whitespace-nowrap">Risk</span>
                <span className="text-sm font-bold font-mono text-red-400">{formatScore(spot.risk_score)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
