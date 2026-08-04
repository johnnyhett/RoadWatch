'use client';

import { useState, useEffect } from 'react';
import { Radio, Navigation, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';

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
  const { latestEvent, isConnected } = useWebSocket('/topic/incidents/live');

  const [alerts, setAlerts] = useState<IncidentAlert[]>([
    { id: '1', time: '1m ago', message: 'High-risk collision reported near Central Junction Hub', lat: 6.6885, lng: -1.6244, type: 'accident' },
    { id: '2', time: '3m ago', message: 'Rain hazard & unlit surface increasing crash probability', lat: 6.7050, lng: -1.6050, type: 'hazard' },
    { id: '3', time: '5m ago', message: 'HDBSCAN identified high-risk cluster formation on Highway Bypass', lat: 6.6745, lng: -1.5714, type: 'blackspot' },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Prepend live incoming STOMP events to feed
  useEffect(() => {
    if (latestEvent && latestEvent.incident) {
      const inc = latestEvent.incident;
      const newAlert: IncidentAlert = {
        id: latestEvent.eventId || String(Date.now()),
        time: 'JUST NOW',
        message: `EMERGENCY TELEMETRY: ${latestEvent.predictedSeverity || 'HIGH'} severity incident at (${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}) - ${inc.weather_condition || 'Clear'}`,
        lat: inc.latitude || 6.6885,
        lng: inc.longitude || -1.6244,
        type: 'accident',
      };

      setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)].slice(0, 10));
      setCurrentIndex(0);
    }
  }, [latestEvent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const current = alerts[currentIndex] || alerts[0];

  const handleFly = () => {
    if (onFlyTo && current) {
      onFlyTo(current.lat, current.lng);
    }
  };

  return (
    <div className="glass-card px-4 py-2 flex items-center justify-between gap-3 bg-[#0d1117]/95 border-white/15 shadow-2xl rounded-xl">
      {/* Feed Identifier & STOMP Status Indicator */}
      <div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
        </span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Emergency Telemetry</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono border border-cyan-500/30">
            {isConnected ? 'LIVE WS' : 'FEED ACTIVE'}
          </span>
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

