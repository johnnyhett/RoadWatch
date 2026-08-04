'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsGrid from '@/components/dashboard/StatsGrid';
import LiveTicker from '@/components/dashboard/LiveTicker';
import SeverityChart from '@/components/dashboard/SeverityChart';
import TemporalChart from '@/components/dashboard/TemporalChart';
import BlackspotList from '@/components/blackspot/BlackspotList';
import BlackspotDrawer from '@/components/blackspot/BlackspotDrawer';
import RiskPredictor from '@/components/prediction/RiskPredictor';
import { getIncidents, getBlackspots, setGlobalLocationCenter } from '@/lib/api';
import { Incident, Blackspot } from '@/types';
import { useLocationContext } from '@/context/LocationContext';
import { Layers, Filter, Target, Zap, Compass, Globe, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

const Map = dynamic(() => import('@/components/map/MapContainer'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-white/60 text-xs font-medium">Loading map and incident data...</p>
      </div>
    </div>
  )
});

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [blackspots, setBlackspots] = useState<Blackspot[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Location Context
  const { location, loading: locLoading, enableGps, flyToCoords, setFlyToCoords } = useLocationContext();

  // Headroom & Panel Collapse States
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Layer & Filter State
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBlackspots, setShowBlackspots] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);

  // Inspector & Camera State
  const [selectedBlackspot, setSelectedBlackspot] = useState<Blackspot | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const loadDataForLocation = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setGlobalLocationCenter(lat, lng);
    try {
      const [incData, spotData] = await Promise.all([getIncidents(), getBlackspots()]);
      setIncidents(incData);
      setBlackspots(spotData);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // When location changes globally, update data for that city!
  useEffect(() => {
    const lat = location?.latitude || 51.505;
    const lng = location?.longitude || -0.09;
    loadDataForLocation(lat, lng);
  }, [location, loadDataForLocation]);

  const handleSelectBlackspot = useCallback((spot: Blackspot) => {
    setSelectedBlackspot(spot);
    setFlyToCoords(spot.center);
  }, [setFlyToCoords]);

  const handleFlyToMyLocation = () => {
    if (location) {
      setFlyToCoords([location.latitude, location.longitude]);
    } else {
      enableGps();
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0a0a0f]">
      {/* Background Fullscreen Map Canvas */}
      <div className="absolute inset-0 z-0">
        <Map
          incidents={incidents}
          blackspots={blackspots}
          userLocation={location}
          showHeatmap={showHeatmap}
          showBlackspots={showBlackspots}
          showIncidents={showIncidents}
          selectedSeverity={selectedSeverity}
          onSelectBlackspot={handleSelectBlackspot}
          flyToCoords={flyToCoords}
        />
      </div>
      
      {/* Overlay Dashboard UI */}
      <div className="absolute inset-0 z-10 pointer-events-none p-3 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          {/* Left Floating Panel */}
          <div className="pointer-events-auto flex gap-2 items-start">
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              title={leftPanelOpen ? 'Collapse Left Controls' : 'Expand Left Controls'}
              className="p-2 rounded-lg bg-[#0d1117]/90 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
            >
              {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-cyan-400" />}
            </button>

            <AnimatePresence>
              {leftPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '310px' }}
                  exit={{ opacity: 0, x: -20, width: 0 }}
                  className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-hidden"
                >
                  {/* Map Controls */}
                  <div className="glass-card p-3 space-y-2.5 bg-[#0d1117]/90 border-white/15">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" /> Display Controls
                      </h2>
                      <div className="flex gap-1">
                        <button
                          onClick={handleFlyToMyLocation}
                          className="px-2 py-0.5 bg-white/5 text-cyan-300 border border-white/10 rounded text-[10px] font-medium hover:bg-white/10 transition-colors flex items-center gap-1"
                        >
                          <Compass className={`w-3 h-3 text-cyan-400 ${locLoading ? 'animate-spin' : ''}`} />
                          {location ? 'My Location' : 'Locate Me'}
                        </button>
                        <button
                          onClick={() => setShowRiskModal(true)}
                          className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-cyan-400" /> Assess Risk
                        </button>
                      </div>
                    </div>

                    {/* Location Banner if enabled */}
                    {location && (
                      <div className="p-1.5 bg-white/5 border border-white/10 rounded-md flex items-center justify-between text-[11px] text-white/80">
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{location.city}, {location.country}</span>
                        </div>
                      </div>
                    )}

                    {/* Aligned Toggle Switches */}
                    <div className="space-y-2 text-xs">
                      {/* Heatmap Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Risk Heatmap</span>
                        <button
                          onClick={() => setShowHeatmap(!showHeatmap)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                            showHeatmap ? 'bg-cyan-500' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              showHeatmap ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Blackspots Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">High-Risk Clusters</span>
                        <button
                          onClick={() => setShowBlackspots(!showBlackspots)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                            showBlackspots ? 'bg-cyan-500' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              showBlackspots ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Incidents Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Accident Records ({incidents.length})</span>
                        <button
                          onClick={() => setShowIncidents(!showIncidents)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                            showIncidents ? 'bg-cyan-500' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              showIncidents ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Severity Filter Pills */}
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[10px] text-white/50 block mb-1.5 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Severity Filter
                      </span>
                      <div className="grid grid-cols-5 gap-1 text-[10px]">
                        {[
                          { label: 'All', val: null },
                          { label: 'Fatal', val: 1 },
                          { label: 'Serious', val: 2 },
                          { label: 'Slight', val: 3 },
                          { label: 'Damage', val: 4 },
                        ].map((s) => (
                          <button
                            key={s.label}
                            onClick={() => setSelectedSeverity(s.val)}
                            className={`py-1 rounded text-center transition-all ${
                              selectedSeverity === s.val
                                ? 'bg-cyan-500 text-white font-bold'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Blackspots Hotspots List */}
                  <div className="glass-card p-2.5 flex flex-col gap-2 flex-1 min-h-0 overflow-hidden bg-[#0d1117]/90 border-white/15">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-red-400" /> High-Risk Hotspots ({blackspots.length})
                      </h3>
                    </div>
                    <BlackspotList
                      blackspots={blackspots}
                      selectedBlackspotId={selectedBlackspot?.cluster_id}
                      onSelectBlackspot={handleSelectBlackspot}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Floating Panel */}
          <div className="pointer-events-auto flex gap-2 items-start">
            <AnimatePresence>
              {rightPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '360px' }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  className="flex flex-col gap-2.5"
                >
                  <StatsGrid />
                  <SeverityChart />
                  <TemporalChart />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? 'Collapse Analytics' : 'Expand Analytics'}
              className="p-2 rounded-lg bg-[#0d1117]/90 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
            >
              {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Bottom HUD: Live Incident Ticker */}
        <div className="pointer-events-auto w-full max-w-3xl mx-auto mt-2">
          <LiveTicker onFlyTo={(lat, lng) => setFlyToCoords([lat, lng])} />
        </div>
      </div>

      {/* Slide-Out Detail Drawer */}
      <AnimatePresence>
        {selectedBlackspot && (
          <BlackspotDrawer
            blackspot={selectedBlackspot}
            onClose={() => setSelectedBlackspot(null)}
          />
        )}
      </AnimatePresence>

      {/* Risk Assessment Modal */}
      <AnimatePresence>
        {showRiskModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-xl">
              <button
                onClick={() => setShowRiskModal(false)}
                className="absolute -top-3 -right-3 z-10 p-2 bg-black/90 text-white/70 hover:text-white rounded-full border border-white/20"
              >
                ✕
              </button>
              <RiskPredictor />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
