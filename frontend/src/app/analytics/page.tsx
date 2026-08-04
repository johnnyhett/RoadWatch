'use client';

import { motion } from 'framer-motion';
import { Network, TrendingUp, Grid } from 'lucide-react';
import AssociationGraph from '@/components/analytics/AssociationGraph';
import RuleTable from '@/components/analytics/RuleTable';
import FactorHeatmap from '@/components/analytics/FactorHeatmap';

export default function AnalyticsPage() {
  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4 bg-[#0a0a0f]">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" /> Pattern Analytics Engine
          </h1>
          <p className="text-xs text-white/60">FP-Growth association rule mining and multi-factor co-occurrence matrices.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main Association Network Topology */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 h-[520px] flex flex-col bg-[#0d1117]/90 border-white/15"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Factor Association Network Topology (FP-Growth)
            </h2>
            <div className="flex-1 relative rounded-xl overflow-hidden">
              <AssociationGraph />
            </div>
          </motion.div>

          {/* Rule Metrics Table */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 bg-[#0d1117]/90 border-white/15"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Mined Rule Metrics & Threshold Filters
            </h2>
            <RuleTable />
          </motion.div>
        </div>

        {/* Co-occurrence Correlation Heatmap */}
        <div className="col-span-12 lg:col-span-4">
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 h-[520px] flex flex-col bg-[#0d1117]/90 border-white/15"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-3 flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              Co-occurrence Frequency Matrix
            </h2>
            <div className="flex-1 relative">
              <FactorHeatmap />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
