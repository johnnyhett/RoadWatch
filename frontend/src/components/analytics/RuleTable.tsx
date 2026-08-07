'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssociationRule } from '@/types';
import { getAssociationRules } from '@/lib/api';
import { Filter, ArrowRight, ChevronDown } from 'lucide-react';
import { humanizeFactor } from '@/lib/format';

/** Rows rendered before the "show more" step. */
const PAGE_SIZE = 25;

interface RuleTableProps {
  rules?: AssociationRule[];
}

/** "weather_condition=Raining" -> "Raining" */
function toLabel(raw: string): string {
  const value = raw.includes('=') ? raw.slice(raw.indexOf('=') + 1) : raw;
  return humanizeFactor(value);
}

export default function RuleTable({ rules: propRules }: RuleTableProps) {
  const [fetchedRules, setFetchedRules] = useState<AssociationRule[]>([]);
  const [minConfidence, setMinConfidence] = useState(0.2);
  const [onlyPositiveLift, setOnlyPositiveLift] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const hasPropRules = Boolean(propRules && propRules.length > 0);
  const rules = hasPropRules ? propRules! : fetchedRules;

  useEffect(() => {
    if (hasPropRules) return;
    let cancelled = false;
    getAssociationRules().then((res) => {
      if (!cancelled) setFetchedRules(res);
    });
    return () => {
      cancelled = true;
    };
  }, [hasPropRules]);

  // Ranked by lift: the miner returns rules in generation order, so the head of
  // the list was dominated by lift~1.0 pairs that carry no association at all.
  const filteredRules = useMemo(() => {
    return rules
      .filter((r) => r.confidence >= minConfidence)
      .filter((r) => (onlyPositiveLift ? r.lift > 1.05 : true))
      .sort((a, b) => b.lift - a.lift);
  }, [rules, minConfidence, onlyPositiveLift]);

  const shown = filteredRules.slice(0, visible);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Min Confidence Threshold:</span>
          <span className="font-mono text-cyan-400 font-bold">{Math.round(minConfidence * 100)}%</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-white/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyPositiveLift}
              onChange={(e) => {
                setOnlyPositiveLift(e.target.checked);
                setVisible(PAGE_SIZE);
              }}
              className="w-3.5 h-3.5 accent-cyan-400 cursor-pointer"
            />
            <span title="Lift above 1 means the factors co-occur more often than chance">
              Positive lift only
            </span>
          </label>

          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={minConfidence}
            onChange={(e) => {
              setMinConfidence(parseFloat(e.target.value));
              setVisible(PAGE_SIZE);
            }}
            aria-label="Minimum confidence threshold"
            className="w-40 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      <p className="text-[11px] text-white/50 font-mono px-1">
        Showing {shown.length} of {filteredRules.length} matching rules
        {rules.length !== filteredRules.length && ` (${rules.length} mined)`}
      </p>

      {/* Rules Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4 font-semibold whitespace-nowrap">Antecedent Factors</th>
              <th className="pb-3 pr-4 font-semibold whitespace-nowrap">Consequent Risk</th>
              <th className="pb-3 pr-4 font-semibold">Support</th>
              <th className="pb-3 pr-4 font-semibold">Confidence</th>
              <th className="pb-3 font-semibold">Lift Metric</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-white/5">
            {shown.map((rule, idx) => {
              const anteStr = Array.isArray(rule.antecedent) ? rule.antecedent.join(' + ') : rule.antecedent;
              const conseqStr = Array.isArray(rule.consequent) ? rule.consequent.join(' + ') : rule.consequent;

              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="py-3 pr-4 text-white/90 font-medium">
                    <div className="flex flex-wrap gap-1">
                      {anteStr.split(' + ').map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 whitespace-nowrap">
                          {toLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-red-400 font-bold"><div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 whitespace-nowrap">
                      {conseqStr.split(' + ').map(toLabel).join(' + ')}
                    </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono">
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

      {filteredRules.length === 0 && (
        <p className="text-center text-xs text-white/50 py-6 font-mono">
          No rules meet the current thresholds. Lower the confidence or allow non-positive lift.
        </p>
      )}

      {visible < filteredRules.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono text-cyan-300 transition-all flex items-center justify-center gap-1.5"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show {Math.min(PAGE_SIZE, filteredRules.length - visible)} more
        </button>
      )}
    </div>
  );
}
