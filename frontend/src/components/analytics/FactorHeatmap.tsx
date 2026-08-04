'use client';

import { useEffect, useState } from 'react';
import { getIncidents } from '@/lib/api';

export default function FactorHeatmap() {
  const factors = ['Raining', 'Darkness', 'Speeding', 'A_Road', 'Fatal/Serious'];
  const [matrix, setMatrix] = useState<number[][]>([
    [1.0, 0.62, 0.45, 0.58, 0.42],
    [0.62, 1.0, 0.74, 0.51, 0.68],
    [0.45, 0.74, 1.0, 0.63, 0.81],
    [0.58, 0.51, 0.63, 1.0, 0.39],
    [0.42, 0.68, 0.81, 0.39, 1.0],
  ]);

  useEffect(() => {
    getIncidents().then((incidents) => {
      if (!incidents || incidents.length === 0) return;

      const N = factors.length;
      const counts = Array.from({ length: N }, () => new Array(N).fill(0));

      incidents.forEach((inc) => {
        const matches = [
          inc.weather_condition === 'Raining',
          inc.light_condition.includes('Darkness'),
          (inc.contributing_factors || []).includes('Speeding'),
          inc.road_classification === 'A_Road',
          inc.severity <= 2,
        ];

        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            if (matches[i] && matches[j]) {
              counts[i][j]++;
            }
          }
        }
      });

      const maxCount = Math.max(...counts.flat());
      if (maxCount > 0) {
        const computed = counts.map((row) =>
          row.map((val) => Math.round((val / maxCount) * 100) / 100)
        );
        setMatrix(computed);
      }
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-2">
      <div className="flex pl-20 mb-2">
        {factors.map((f) => (
          <div key={f} className="flex-1 text-center text-[10px] text-white/60 -rotate-45 origin-bottom-left h-8 font-mono truncate">
            {f}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        {matrix.map((row, i) => (
          <div key={i} className="flex-1 flex gap-1.5 items-center">
            <div className="w-20 text-[10px] text-white/60 text-right pr-2 shrink-0 font-mono truncate">
              {factors[i]}
            </div>
            <div className="flex-1 flex gap-1.5 h-full">
              {row.map((val, j) => (
                <div
                  key={j}
                  className="flex-1 rounded border border-white/5 hover:border-cyan-400 transition-all cursor-pointer relative group flex items-center justify-center"
                  style={{
                    backgroundColor: `rgba(0, 212, 255, ${val * 0.75})`,
                  }}
                >
                  <span className="text-[10px] font-mono text-white/90 font-bold opacity-80 group-hover:opacity-100">
                    {val.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
