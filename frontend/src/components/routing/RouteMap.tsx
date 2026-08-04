'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/map/MapContainer'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0a0a0f] animate-pulse" />
});

export default function RouteMap() {
  return (
    <div className="w-full h-full relative">
      <Map />
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 glass-card p-4 z-10 pointer-events-none bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-xl">
        <h4 className="text-sm font-semibold text-white mb-2">Route Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white/70">
            <div className="w-6 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Safest Route
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <div className="w-6 h-1 bg-cyan-400/50 rounded-full" /> Fastest Route
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" /> Blackspot Area
          </div>
        </div>
      </div>
    </div>
  );
}
