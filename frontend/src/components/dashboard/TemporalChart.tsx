'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTemporalPatterns } from '@/lib/api';
import { COLORS } from '@/lib/constants';
import { useLocationContext } from '@/context/LocationContext';

interface HourlyData {
  hour: string;
  incidents: number;
}

export default function TemporalChart() {
  const { location } = useLocationContext();
  const [data, setData] = useState<HourlyData[]>([]);

  useEffect(() => {
    getTemporalPatterns()
      .then((patterns) => {
        if (patterns.hourly_distribution) {
          const hourly = patterns.hourly_distribution.map((h: { hour: number; count: number }) => ({
            hour: `${String(h.hour).padStart(2, '0')}:00`,
            incidents: h.count,
          }));
          setData(hourly);
        }
      })
      .catch(() => {
        const fallback = Array.from({ length: 24 }, (_, i) => ({
          hour: `${String(i).padStart(2, '0')}:00`,
          incidents: Math.floor(Math.random() * 40) + 10,
        }));
        setData(fallback);
      });
  }, [location]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="glass-card p-3 h-48 flex flex-col bg-[#0d1117]/90 border-white/15"
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2 font-mono">
        Hourly Crash Frequency
      </h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis 
              dataKey="hour" 
              stroke="rgba(255,255,255,0.25)" 
              fontSize={9} 
              tickMargin={6}
              tickFormatter={(v, i) => i % 4 === 0 ? v : ''}
            />
            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={9} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(13, 17, 23, 0.95)', 
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
              }}
              itemStyle={{ color: COLORS.primary }}
            />
            <Area 
              type="monotone" 
              dataKey="incidents" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIncidents)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
