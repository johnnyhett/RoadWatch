'use client';

import { useEffect, useState } from 'react';
import { AssociationRule } from '@/types';
import { getAssociationRules } from '@/lib/api';
import { Filter, ArrowRight } from 'lucide-react';

interface RuleTableProps {
  onRulesLoaded?: (rules: AssociationRule[]) => void;
}

export default function RuleTable({ onRulesLoaded }: RuleTableProps) {
  const [rules, setRules] = useState<AssociationRule[]>([]);
  const [minConfidence, setMinConfidence] = useState(0.2);

  useEffect(() => {
    getAssociationRules().then((res) => {
      setRules(res);
      if (onRulesLoaded) onRulesLoaded(res);
    });
  }, [onRulesLoaded]);

  const filteredRules = rules.filter((r) => r.confidence >= minConfidence);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Min Confidence Threshold:</span>
          <span className="font-mono text-cyan-400 font-bold">{Math.round(minConfidence * 100)}%</span>
        </div>

        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.05"
          value={minConfidence}
          onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
          className="w-48 accent-cyan-400 cursor-pointer"
        />
      </div>

      {/* Rules Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
              <th className="pb-3 font-semibold">Antecedent Factors</th>
              <th className="pb-3 font-semibold">Consequent Risk</th>
              <th className="pb-3 font-semibold">Support</th>
              <th className="pb-3 font-semibold">Confidence</th>
              <th className="pb-3 font-semibold">Lift Metric</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-white/5">
            {filteredRules.map((rule, idx) => {
              const anteStr = Array.isArray(rule.antecedent) ? rule.antecedent.join(' + ') : rule.antecedent;
              const conseqStr = Array.isArray(rule.consequent) ? rule.consequent.join(' + ') : rule.consequent;

              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="py-3 text-white/90 font-medium">
                    <div className="flex flex-wrap gap-1">
                      {anteStr.split(' + ').map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-red-400 font-bold flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                      {conseqStr}
                    </span>
                  </td>
                  <td className="py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">{Math.round(rule.support * 100)}%</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, rule.support * 300)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{Math.round(rule.confidence * 100)}%</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${rule.confidence * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-amber-400 font-bold">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {rule.lift.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
