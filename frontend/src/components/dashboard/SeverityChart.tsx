'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getIncidentStats } from '@/lib/api';
import { SEVERITY_COLORS } from '@/lib/constants';
import { useLocationContext } from '@/context/LocationContext';

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

export default function SeverityChart() {
  const { location } = useLocationContext();
  const [data, setData] = useState<ChartEntry[]>([]);

  useEffect(() => {
    getIncidentStats()
      .then((stats) => {
        if (stats.by_severity) {
          const entries: ChartEntry[] = Object.entries(stats.by_severity).map(([name, value]) => ({
            name,
            value: value as number,
            color: SEVERITY_COLORS[name] || '#6b7280',
          }));
          setData(entries);
        }
      })
      .catch(() => setData([]));
  }, [location]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="glass-card p-3 h-52 flex flex-col bg-[#0d1117]/90 border-white/15"
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2">
        Severity Distribution
      </h3>
      <div className="flex-1 w-full relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={40}
                outerRadius={60}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                animationBegin={100}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(13, 17, 23, 0.95)', 
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={26}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-white/70 text-[10px]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
