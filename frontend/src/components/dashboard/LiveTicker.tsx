'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface LiveTickerProps {
  onFlyTo?: (lat: number, lng: number) => void;
}

interface IncidentEvent {
  eventId: string;
  type: string;
  location?: [number, number];
  lat?: number;
  lng?: number;
  message: string;
  severity: string;
  time: string;
}

export default function LiveTicker({ onFlyTo }: LiveTickerProps) {
  const { latestEvent, isConnected } = useWebSocket();
  const [events, setEvents] = useState<IncidentEvent[]>([
    {
      eventId: '1',
      type: 'HOTSPOT_ALERT',
      lat: 51.5155,
      lng: -0.1419,
      message: 'High-risk incident cluster detected near Oxford Circus',
      severity: 'HIGH',
      time: 'Just now',
    },
    {
      eventId: '2',
      type: 'WEATHER_ANOMALY',
      lat: 51.5013,
      lng: -0.1248,
      message: 'Weather hazard: Rain and unlit road surface increase risk',
      severity: 'MEDIUM',
      time: '2m ago',
    },
    {
      eventId: '3',
      type: 'SAFETY_REROUTE',
      lat: 51.5081,
      lng: -0.0759,
      message: 'Safety navigation: Detour path calculated avoiding crash hotspot',
      severity: 'LOW',
      time: '4m ago',
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (latestEvent) {
      const inc = latestEvent.incident;
      const newEvt: IncidentEvent = {
        eventId: latestEvent.eventId || String(Date.now()),
        type: latestEvent.type || 'NEW_INCIDENT',
        lat: inc?.latitude || 51.5074,
        lng: inc?.longitude || -0.1278,
        message: `Incident reported at (${inc?.latitude?.toFixed(4)}, ${inc?.longitude?.toFixed(4)}) — ${latestEvent.predictedSeverity || 'HIGH'} Risk`,
        severity: latestEvent.predictedSeverity || 'HIGH',
        time: 'Live',
      };

      setEvents((prev) => [newEvt, ...prev.slice(0, 9)]);
      setCurrentIndex(0);
    }
  }, [latestEvent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [events.length]);

  const current = events[currentIndex] || events[0];

  return (
    <div className="glass-card px-4 py-2.5 flex items-center justify-between gap-4 overflow-hidden border-white/10">
      {/* Live Indicator */}
      <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md shrink-0 border border-red-500/20 text-xs font-semibold">
        <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
        <span>Incident Feed</span>
      </div>

      {/* Message Text Slider */}
      <div className="flex-1 overflow-hidden relative h-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.eventId || currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center text-xs text-white/90 truncate"
          >
            <span className="text-white/40 font-mono text-[11px] mr-2">[{current?.time}]</span>
            <span className="truncate">{current?.message}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fly-To Button */}
      {current?.lat && current?.lng && onFlyTo && (
        <button
          onClick={() => onFlyTo(current.lat!, current.lng!)}
          className="px-2.5 py-1 rounded bg-white/5 text-white/80 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-1 shrink-0"
        >
          <Navigation className="w-3 h-3 text-cyan-400" /> View on Map
        </button>
      )}
    </div>
  );
}
