'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SafetyAuditReport, SafetyAuditRequest } from '@/types';
import { getSafetyAuditReport } from '@/lib/api';
import { X, ShieldCheck, Download, AlertTriangle, Building2, Calendar, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface SafetyAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SafetyAuditDrawer({ isOpen, onClose }: SafetyAuditDrawerProps) {
  const [jurisdiction, setJurisdiction] = useState('Metropolitan Traffic Authority');
  const [report, setReport] = useState<SafetyAuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await getSafetyAuditReport({ jurisdiction });
      setReport(res);
    } catch (e) {
      console.error('Audit generation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Traffic_Safety_Audit_${report.auditId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-xl h-full glass-panel border-l border-white/15 p-6 flex flex-col justify-between shadow-2xl bg-[#0a0a0f]/95 overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Institutional Safety Engine
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight font-heading mt-1">
                Municipal Traffic Safety Audit
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form / Trigger Controls */}
          <div className="glass-card p-4 space-y-3 bg-white/5 border-white/10">
            <label className="text-xs font-semibold text-white/80 block font-mono">
              Target Municipality / Region Authority
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="Enter Municipality Name..."
                className="flex-1 bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,212,255,0.3)] shrink-0"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{loading ? 'Generating...' : 'Run Audit'}</span>
              </button>
            </div>
          </div>

          {/* Audit Results View */}
          {report && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Overall Score Badge */}
              <div className="glass-card p-4 border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-300 uppercase block font-semibold">
                    Audit ID: {report.auditId}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{report.overallSafetyRating}</h3>
                  <span className="text-xs text-white/60 block mt-1">{report.summary}</span>
                </div>
                <div className="text-center bg-cyan-500/20 px-3 py-2 rounded-xl border border-cyan-500/40">
                  <span className="text-2xl font-bold font-mono text-cyan-300">{report.safetyScore}</span>
                  <span className="text-[10px] text-white/50 block font-mono">/ 100 Score</span>
                </div>
              </div>

              {/* Core Audit Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="glass-card p-3 bg-white/5">
                  <span className="text-[11px] text-white/50 block">Accidents Analyzed</span>
                  <span className="text-xl font-bold font-mono text-white">{report.totalAccidentsAnalyzed}</span>
                </div>
                <div className="glass-card p-3 bg-white/5">
                  <span className="text-[11px] text-white/50 block">Blackspot Clusters</span>
                  <span className="text-xl font-bold font-mono text-red-400">{report.blackspotsIdentified}</span>
                </div>
              </div>

              {/* Factor Breakdown */}
              <div className="glass-card p-4 space-y-3 bg-white/5 border-white/10">
                <h4 className="text-xs font-bold text-white uppercase font-heading tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Primary Crash Factor Distribution
                </h4>
                <div className="space-y-2">
                  {Object.entries(report.factorBreakdown).map(([factor, cnt]) => {
                    const pct = Math.round((cnt / report.totalAccidentsAnalyzed) * 100);
                    return (
                      <div key={factor} className="space-y-1">
                        <div className="flex justify-between text-xs text-white/80">
                          <span>{factor}</span>
                          <span className="font-mono text-cyan-400 font-semibold">{cnt} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Engineering Countermeasures */}
              <div className="glass-card p-4 space-y-3 bg-white/5 border-white/10">
                <h4 className="text-xs font-bold text-white uppercase font-heading tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Priority Engineering Interventions
                </h4>
                <div className="space-y-2.5">
                  {report.priorityInterventions.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-cyan-300">{item.location}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-white/80">{item.countermeasure}</p>
                      <div className="flex justify-between text-[10px] font-mono text-white/50 pt-1 border-t border-white/5">
                        <span>Est. Risk Reduction: <strong className="text-emerald-400">-{item.estimatedRiskReductionPct}%</strong></span>
                        <span>Est. Cost: <strong className="text-white/80">{item.costEstimate}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        {report && (
          <div className="pt-4 border-t border-white/10 flex gap-3">
            <button
              onClick={handleDownloadJson}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Data (JSON)</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
