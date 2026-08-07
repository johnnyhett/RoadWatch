'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AssociationRule } from '@/types';
import { getAssociationRules } from '@/lib/api';
import { Network, TrendingUp, Grid, ShieldCheck } from 'lucide-react';
import AssociationGraph from '@/components/analytics/AssociationGraph';
import RuleTable from '@/components/analytics/RuleTable';
import FactorHeatmap from '@/components/analytics/FactorHeatmap';
import SafetyAuditDrawer from '@/components/analytics/SafetyAuditDrawer';

export default function AnalyticsPage() {
  const [auditOpen, setAuditOpen] = useState(false);

  // Mined once here and shared with both consumers. The graph and the table
  // each used to fetch independently, and every call POSTs the whole incident
  // horizon upstream.
  const [rules, setRules] = useState<AssociationRule[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAssociationRules().then((res) => {
      if (!cancelled) setRules(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

        <button
          onClick={() => setAuditOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Export Safety Audit</span>
        </button>
      </div>

      <SafetyAuditDrawer isOpen={auditOpen} onClose={() => setAuditOpen(false)} />

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
              <AssociationGraph rules={rules} />
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
            <RuleTable rules={rules} />
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
