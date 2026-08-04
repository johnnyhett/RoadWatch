'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Car, Users, Skull } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getIncidentStats } from '@/lib/api';
import { IncidentStats } from '@/types';
import { useLocationContext } from '@/context/LocationContext';

const AnimatedNumber = ({ value, duration = 1200 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = display;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      
      setDisplay(current);
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
};

export default function StatsGrid() {
  const { location } = useLocationContext();
  const [stats, setStats] = useState<IncidentStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getIncidentStats();
      setStats(data);
    } catch {
      console.warn('Failed to fetch stats');
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, location]);

  const cards = [
    {
      title: 'Total Accidents',
      value: stats?.total ?? 0,
      icon: Car,
      color: 'text-cyan-400',
    },
    {
      title: 'Fatal Crashes',
      value: stats?.by_severity?.['Fatal'] ?? 0,
      icon: Skull,
      color: 'text-red-400',
    },
    {
      title: 'Serious Injuries',
      value: stats?.by_severity?.['Serious'] ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      title: 'Total Casualties',
      value: stats?.total_casualties ?? 0,
      icon: Users,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {cards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            key={stat.title}
            className="glass-card p-3 flex flex-col gap-2 relative overflow-hidden bg-[#0d1117]/90 border-white/15"
          >
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{stat.title}</span>
              <div className={`p-1 rounded-md bg-white/5 border border-white/10 ${stat.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1 relative z-10">
              <span className={`text-xl font-bold font-mono tracking-tight ${stat.color}`}>
                <AnimatedNumber value={stat.value} />
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
