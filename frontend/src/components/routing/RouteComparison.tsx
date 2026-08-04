'use client';

import { RouteComparison as RouteCompType } from '@/types';
import { Shield, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface RouteComparisonProps {
  comparison: RouteCompType | null;
}

export default function RouteComparison({ comparison }: RouteComparisonProps) {
  if (!comparison) {
    return (
      <div className="glass-card p-5 text-center text-white/50 text-xs">
        <Shield className="w-8 h-8 mx-auto mb-2 text-cyan-400 opacity-40" />
        Select start location and destination to compare route safety.
      </div>
    );
  }

  const safest = comparison.safest_route;
  const fastest = comparison.fastest_route;
  const mode = safest.mode || 'car';
  const modeLabel = mode === 'motorcycle' ? '🏍️ Motorcycle' : mode === 'bicycle' ? '🚲 Bicycle' : mode === 'pedestrian' ? '🚶 Pedestrian' : '🚗 Car';

  const riskReduction = Math.round(
    ((fastest.total_risk - safest.total_risk) / (fastest.total_risk || 1)) * 100
  );

  return (
    <div className="space-y-3">
      {/* Mode Indicator Pill */}
      <div className="flex items-center justify-between px-1 text-xs text-white/60 font-mono">
        <span>Active Travel Profile:</span>
        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
          {modeLabel} Mode
        </span>
      </div>

      {/* Recommended Safest Route Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 border-emerald-500/40 bg-emerald-500/5 relative overflow-hidden space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Safest Route
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -{riskReduction}% Risk Reduction
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/50 block">Distance</span>
            <span className="text-sm font-semibold text-white">{safest.distance_km} km</span>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/50 block">Est. Time</span>
            <span className="text-sm font-semibold text-white">
              {Math.round((safest.distance_km / 30) * 60)} min
            </span>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/50 block">Risk Score</span>
            <span className="text-sm font-semibold text-emerald-400">{safest.total_risk}</span>
          </div>
        </div>
      </motion.div>

      {/* Direct / Fastest Route Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 border-white/10 opacity-80 hover:opacity-100 transition-opacity space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" /> Direct Route
          </span>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold text-[10px]">
            Higher Risk
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/50 block">Distance</span>
            <span className="text-sm font-semibold text-white">{fastest.distance_km} km</span>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/50 block">Est. Time</span>
            <span className="text-sm font-semibold text-white">
              {Math.round((fastest.distance_km / 35) * 60)} min
            </span>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-white/50 block">Risk Score</span>
            <span className="text-sm font-semibold text-red-400">{fastest.total_risk}</span>
          </div>
        </div>

        <div className="text-[11px] text-amber-400 flex items-center gap-1 pt-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Passes through identified accident hotspot boundaries.</span>
        </div>
      </motion.div>
    </div>
  );
}
