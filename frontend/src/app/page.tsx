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
import { useUserPreferences } from '@/context/UserPreferencesContext';
import { Layers, Filter, Target, Zap, Compass, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Cpu } from 'lucide-react';

const Map = dynamic(() => import('@/components/map/MapContainer'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#070a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-white/60 text-xs font-medium font-mono">Loading map and incident telemetry...</p>
      </div>
    </div>
  )
});

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [blackspots, setBlackspots] = useState<Blackspot[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Location Context & Preferences
  const { location, loading: locLoading, enableGps, flyToCoords, setFlyToCoords } = useLocationContext();
  const { themeMode } = useUserPreferences();

  // Apply themeMode to document root element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (themeMode === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    }
  }, [themeMode]);

  // Headroom & Panel Collapse States
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<'analytics' | 'ml_predictor'>('analytics');

  // Layer & Filter State
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBlackspots, setShowBlackspots] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);

  // Inspector State
  const [selectedBlackspot, setSelectedBlackspot] = useState<Blackspot | null>(null);

  useEffect(() => {
    const lat = location?.latitude || 6.6885;
    const lng = location?.longitude || -1.6244;
    setGlobalLocationCenter(lat, lng);

    let cancelled = false;
    Promise.all([getIncidents(), getBlackspots()])
      .then(([incData, spotData]) => {
        if (cancelled) return;
        setIncidents(incData);
        setBlackspots(spotData);
      })
      .catch((err) => console.error('Data loading error:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

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

  // 1-Click Analytical View Presets
  const setPresetMode = (mode: 'full' | 'hotspots' | 'heatmap') => {
    if (mode === 'full') {
      setShowHeatmap(true);
      setShowBlackspots(true);
      setShowIncidents(true);
    } else if (mode === 'hotspots') {
      setShowHeatmap(false);
      setShowBlackspots(true);
      setShowIncidents(false);
    } else if (mode === 'heatmap') {
      setShowHeatmap(true);
      setShowBlackspots(false);
      setShowIncidents(false);
    }
  };

  return (
    <div className={`w-full h-full relative overflow-hidden ${themeMode === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#070a0f]'}`}>
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
      
      {/* Data load indicator */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
              <span className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <span className="text-[11px] font-mono text-white/80">Loading incident horizon...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay Dashboard UI */}
      <div className="absolute inset-0 z-10 pointer-events-none p-3 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          {/* Left Floating Glass Panel */}
          <div className="pointer-events-auto flex gap-2 items-start">
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              title={leftPanelOpen ? 'Collapse Left Controls' : 'Expand Left Controls'}
              className="p-2 rounded-xl glass-panel text-white/80 hover:text-white transition-all shadow-xl"
            >
              {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-cyan-400" />}
            </button>

            <AnimatePresence>
              {leftPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '320px' }}
                  exit={{ opacity: 0, x: -20, width: 0 }}
                  className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-hidden max-w-[calc(100vw-5rem)]"
                >
                  {/* Pattern Discovery Layer Controls */}
                  <div className="glass-panel p-3 space-y-3 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-heading">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" /> Spatial Pattern Layers
                      </h2>
                      <div className="flex gap-1">
                        <button
                          onClick={handleFlyToMyLocation}
                          className="px-2 py-0.5 glass-pill text-cyan-300 rounded text-[10px] font-mono hover:bg-cyan-500/20 transition-all flex items-center gap-1"
                        >
                          <Compass className={`w-3 h-3 text-cyan-400 ${locLoading ? 'animate-spin' : ''}`} />
                          {location ? 'My Area' : 'Locate'}
                        </button>
                        <button
                          onClick={() => {
                            setRightPanelOpen(true);
                            setActiveRightTab('ml_predictor');
                          }}
                          className="px-2 py-0.5 glass-pill text-cyan-300 rounded text-[10px] font-mono hover:bg-cyan-500/20 transition-all flex items-center gap-1 font-bold"
                        >
                          <Zap className="w-3 h-3 text-cyan-400" /> Predict ML
                        </button>
                      </div>
                    </div>

                    {/* Quick Analytical Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/50 font-mono block uppercase font-semibold">
                        Analytical Presets
                      </span>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <button
                          onClick={() => setPresetMode('hotspots')}
                          className={`py-1 px-1 rounded-lg text-center font-mono border transition-all ${
                            showBlackspots && !showHeatmap && !showIncidents
                              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          Hotspots Only
                        </button>
                        <button
                          onClick={() => setPresetMode('heatmap')}
                          className={`py-1 px-1 rounded-lg text-center font-mono border transition-all ${
                            showHeatmap && !showBlackspots && !showIncidents
                              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          KDE Heatmap
                        </button>
                        <button
                          onClick={() => setPresetMode('full')}
                          className={`py-1 px-1 rounded-lg text-center font-mono border transition-all ${
                            showHeatmap && showBlackspots && showIncidents
                              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          Full View
                        </button>
                      </div>
                    </div>

                    {/* ALIGNED TOGGLE SWITCHES WITH HELPER DESCRIPTIONS */}
                    <div className="space-y-2.5 pt-1 border-t border-white/10 text-xs">
                      {/* Risk Heatmap */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-white/90 font-medium block text-xs">Risk Density Surface</span>
                          <span className="text-[10px] text-white/40 block font-mono">Continuous KDE kernel risk</span>
                        </div>
                        <button
                          onClick={() => setShowHeatmap(!showHeatmap)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                            showHeatmap ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,212,255,0.4)]' : 'bg-white/15'
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-white/90 font-medium block text-xs">HDBSCAN Blackspots</span>
                          <span className="text-[10px] text-white/40 block font-mono">Isolated high-risk clusters</span>
                        </div>
                        <button
                          onClick={() => setShowBlackspots(!showBlackspots)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                            showBlackspots ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,212,255,0.4)]' : 'bg-white/15'
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-white/90 font-medium block text-xs">Crash Incidents ({incidents.length})</span>
                          <span className="text-[10px] text-white/40 block font-mono">Granular accident markers</span>
                        </div>
                        <button
                          onClick={() => setShowIncidents(!showIncidents)}
                          className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 p-0.5 ${
                            showIncidents ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,212,255,0.4)]' : 'bg-white/15'
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
                      <span className="text-[10px] text-white/50 block mb-1.5 font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
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
                            className={`py-1 rounded text-center font-mono transition-all ${
                              selectedSeverity === s.val
                                ? 'bg-cyan-500 text-white font-bold shadow-[0_0_10px_rgba(0,212,255,0.3)]'
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
                  <div className="glass-panel p-2.5 flex flex-col gap-2 flex-1 min-h-0 overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
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

          {/* Right Floating Glass Panel: Analytics & Embedded ML Risk Classifier */}
          <div className="pointer-events-auto hidden md:flex gap-2 items-start">
            <AnimatePresence>
              {rightPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '380px' }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar max-w-[calc(100vw-5rem)]"
                >
                  {/* Segmented Tab Header */}
                  <div className="glass-panel p-1 rounded-xl flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => setActiveRightTab('analytics')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeRightTab === 'analytics'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> Analytics
                    </button>
                    <button
                      onClick={() => setActiveRightTab('ml_predictor')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeRightTab === 'ml_predictor'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> XGBoost ML Predictor
                    </button>
                  </div>

                  {activeRightTab === 'analytics' ? (
                    <>
                      <StatsGrid />
                      <SeverityChart />
                      <TemporalChart />
                    </>
                  ) : (
                    <RiskPredictor />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? 'Collapse Right Panel' : 'Expand Right Panel'}
              className="p-2 rounded-xl glass-panel text-white/80 hover:text-white transition-all shadow-xl"
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
    </div>
  );
}
