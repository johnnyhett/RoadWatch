'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import RouteForm from '@/components/routing/RouteForm';
import RouteComparison from '@/components/routing/RouteComparison';
import { RouteParams, RouteComparison as RouteCompType } from '@/types';
import { getSafestRoute } from '@/lib/api';
import { Navigation, Layers } from 'lucide-react';

const Map = dynamic(() => import('@/components/map/MapContainer'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-cyan-500 font-mono text-xs animate-pulse">LOADING ROUTE MAP...</p>
      </div>
    </div>
  )
});

export default function RoutesPage() {
  const [comparison, setComparison] = useState<RouteCompType | null>(null);
  const [loading, setLoading] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

  const handleComputeRoute = async (params: RouteParams) => {
    setLoading(true);
    try {
      const res = await getSafestRoute(params);
      setComparison(res);
      if (res.safest_route.path && res.safest_route.path.length > 0) {
        setFlyToCoords(res.safest_route.path[0]);
      }
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex relative overflow-hidden bg-[#0a0a0f]">
      {/* Left Control Panel */}
      <div className="w-[420px] glass-panel border-y-0 border-l-0 z-10 flex flex-col p-5 overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Navigation className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold tracking-tight text-white">Safety Route Engine</h1>
        </div>

        <RouteForm onComputeRoute={handleComputeRoute} loading={loading} />

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Comparative Risk Evaluation</h3>
          <RouteComparison comparison={comparison} />
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          safestRoute={comparison?.safest_route}
          fastestRoute={comparison?.fastest_route}
          showHeatmap={true}
          showBlackspots={true}
          flyToCoords={flyToCoords}
        />
        
        {/* Map Legend Overlay */}
        <div className="absolute bottom-6 right-6 glass-card p-4 z-10 pointer-events-none space-y-2 text-xs">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Navigation Legend
          </h4>
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-6 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>Safest A* Route (Min Risk)</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-6 h-1.5 bg-red-500 rounded-full opacity-80" />
              <span>Direct Route (Blackspot Exposure)</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500" />
              <span>HDBSCAN Blackspot Cluster</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
