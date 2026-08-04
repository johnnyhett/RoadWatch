'use client';

import { useState, useEffect } from 'react';
import { Radio, Navigation, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IncidentAlert {
  id: string;
  time: string;
  message: string;
  lat: number;
  lng: number;
  type: 'accident' | 'hazard' | 'blackspot';
}

interface LiveTickerProps {
  onFlyTo?: (lat: number, lng: number) => void;
}

export default function LiveTicker({ onFlyTo }: LiveTickerProps) {
  const [alerts, setAlerts] = useState<IncidentAlert[]>([
    { id: '1', time: '1m ago', message: 'High-risk collision reported near Central Junction', lat: 6.6885, lng: -1.6244, type: 'accident' },
    { id: '2', time: '3m ago', message: 'Rain hazard & unlit surface increasing crash probability', lat: 6.7050, lng: -1.6050, type: 'hazard' },
    { id: '3', time: '5m ago', message: 'HDBSCAN identified high-risk cluster formation on Highway Bypass', lat: 6.6745, lng: -1.5714, type: 'blackspot' },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const current = alerts[currentIndex];

  const handleFly = () => {
    if (onFlyTo && current) {
      onFlyTo(current.lat, current.lng);
    }
  };

  return (
    <div className="glass-card px-4 py-2 flex items-center justify-between gap-3 bg-[#0d1117]/95 border-white/15 shadow-2xl rounded-xl">
      {/* Feed Identifier */}
      <div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
        </span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>Incident Feed</span>
        </div>
      </div>

      {/* Animated Alert Ticker Message */}
      <div className="flex-1 overflow-hidden h-6 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-xs font-mono truncate"
          >
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[10px] shrink-0">
              [{current.time}]
            </span>
            <span className="text-white/90 truncate flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {current.message}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive FlyTo Button */}
      <button
        onClick={handleFly}
        className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/25 hover:border-cyan-400 text-xs font-mono text-cyan-300 font-semibold transition-all flex items-center gap-1.5 shrink-0"
      >
        <Navigation className="w-3 h-3 text-cyan-400" />
        <span>View on Map</span>
        <ChevronRight className="w-3 h-3 text-cyan-400" />
      </button>
    </div>
  );
}
