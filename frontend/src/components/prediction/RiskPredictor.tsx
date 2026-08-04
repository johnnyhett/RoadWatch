'use client';

import { useState, useEffect } from 'react';
import { predictRisk } from '@/lib/api';
import { RiskPrediction } from '@/types';
import { Zap, AlertTriangle, Activity, MapPin, Wrench, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';
import { motion } from 'framer-motion';

// Real Location Presets in Ghana & Globally for Instant Assessment
const LOCATION_PRESETS = [
  { name: 'Kumasi Central Interchange Hub', lat: 6.6885, lng: -1.6244, speed: 45, road: 'A_Road', light: 'Darkness_Lit' },
  { name: 'Accra N1 Highway Corridor', lat: 5.5545, lng: -0.1902, speed: 70, road: 'Motorway', light: 'Darkness_Unlit' },
  { name: 'Tamale Northern Highway Bypass', lat: 9.4008, lng: -0.8393, speed: 60, road: 'A_Road', light: 'Darkness_Unlit' },
  { name: 'Takoradi Port Road Junction', lat: 4.8845, lng: -1.7554, speed: 30, road: 'B_Road', light: 'Daylight' },
];

export default function RiskPredictor() {
  const { location } = useLocationContext();

  const [selectedLocation, setSelectedLocation] = useState(LOCATION_PRESETS[0].name);
  const [weather, setWeather] = useState('Raining');
  const [light, setLight] = useState('Darkness_Unlit');
  const [roadType, setRoadType] = useState('Motorway');
  const [speedLimit, setSpeedLimit] = useState(70);
  const [mitigationsApplied, setMitigationsApplied] = useState(false);

  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPreset = (presetName: string) => {
    setSelectedLocation(presetName);
    const p = LOCATION_PRESETS.find((item) => item.name === presetName);
    if (p) {
      setSpeedLimit(p.speed);
      setRoadType(p.road);
      setLight(p.light);
      setMitigationsApplied(false);
    }
  };

  const handlePredict = async (applyMitigation = false) => {
    setLoading(true);
    try {
      // If mitigations applied, simulate reduced speed & upgraded lighting
      const effectiveSpeed = applyMitigation ? Math.max(30, speedLimit - 15) : speedLimit;
      const effectiveLight = applyMitigation ? 'Darkness_Lit' : light;
      const effectiveWeather = applyMitigation && weather === 'Raining' ? 'Clear' : weather;

      const res = await predictRisk({
        weather: effectiveWeather,
        light: effectiveLight,
        road_type: roadType,
        speed_limit: effectiveSpeed,
        hour: 22,
        day_of_week: 5,
      });

      setPrediction(res);
      setMitigationsApplied(applyMitigation);
    } catch (err) {
      console.error('Risk prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePredict(false);
  }, [selectedLocation, weather, light, roadType, speedLimit]);

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Container Header */}
      <div className="glass-card p-4 space-y-3 bg-[#0d1117]/95 border-cyan-500/30">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 font-heading">
              <Zap className="w-4 h-4 text-cyan-400" /> Site-Specific Crash Risk Assessor
            </h2>
            <p className="text-[10px] text-white/50 font-mono">
              Ensemble XGBoost ML model trained on 1,500+ geotagged crash records
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
            ML Engine :8000
          </span>
        </div>

        {/* 1-Click Location Corridor Picker */}
        <div className="space-y-1">
          <label className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block font-mono flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> Target Highway Corridor / Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
          >
            {LOCATION_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.speed} mph)
              </option>
            ))}
          </select>
        </div>

        {/* Environmental Parameters Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-white/60 mb-1">Weather Condition</label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="Clear">Clear / Fine</option>
              <option value="Raining">Raining / Heavy Rain</option>
              <option value="Fog">Fog / Harmattan Dust</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-white/60 mb-1">Lighting Condition</label>
            <select
              value={light}
              onChange={(e) => setLight(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="Daylight">Daylight</option>
              <option value="Darkness_Lit">Darkness (Lights Lit)</option>
              <option value="Darkness_Unlit">Darkness (Unlit Road)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-white/60 mb-1">Road Classification</label>
            <select
              value={roadType}
              onChange={(e) => setRoadType(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="Motorway">Motorway Express</option>
              <option value="A_Road">A-Road Arterial</option>
              <option value="B_Road">B-Road Secondary</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-white/60 mb-1">Speed Limit</label>
            <select
              value={speedLimit}
              onChange={(e) => setSpeedLimit(parseInt(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value={30}>30 mph</option>
              <option value={45}>45 mph</option>
              <option value={50}>50 mph</option>
              <option value={60}>60 mph</option>
              <option value={70}>70 mph</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handlePredict(false)}
          disabled={loading}
          className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,212,255,0.2)]"
        >
          <Activity className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Running ML Inference...' : 'Calculate Site Risk Assessment'}</span>
        </button>
      </div>

      {/* Model Output & Action Plan */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-4 border space-y-3 ${
            mitigationsApplied
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : prediction.risk_level === 'High Risk' || prediction.risk_level === 'HIGH'
              ? 'border-red-500/40 bg-red-500/10'
              : 'border-amber-500/40 bg-amber-500/10'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${
                  mitigationsApplied
                    ? 'text-emerald-400'
                    : prediction.risk_level.includes('High') || prediction.risk_level === 'HIGH'
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}
              />
              <div>
                <h3 className="text-xs font-bold text-white font-heading">
                  Risk Level:{' '}
                  <span className={mitigationsApplied ? 'text-emerald-400' : 'text-cyan-400'}>
                    {prediction.risk_level}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-white/70">{prediction.severity_prediction}</p>
              </div>
            </div>

            {prediction.risk_score && (
              <div className="text-right">
                <span className="text-[10px] font-mono text-white/50 block">Risk Index</span>
                <strong
                  className={`text-lg font-mono font-bold ${
                    prediction.risk_score > 70 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {prediction.risk_score} / 100
                </strong>
              </div>
            )}
          </div>

          {/* Probability Bars */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block font-semibold">
              Estimated Crash Severity Probabilities
            </span>
            {Object.entries(prediction.probabilities || {}).map(([cls, prob]) => {
              const pct = Math.round((prob as number) * 100);
              return (
                <div key={cls} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/80">{cls}</span>
                    <span className="text-white font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cls === 'Fatal'
                          ? 'bg-red-500'
                          : cls === 'Serious'
                          ? 'bg-orange-500'
                          : cls === 'Slight'
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actionable Engineering Mitigations */}
          {prediction.recommended_mitigations && prediction.recommended_mitigations.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-3 h-3 text-emerald-400" /> Engineering Action Plan
              </span>
              <div className="space-y-1">
                {prediction.recommended_mitigations.map((m, idx) => (
                  <div key={idx} className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>

              {/* Mitigation Simulation Trigger */}
              <button
                onClick={() => handlePredict(!mitigationsApplied)}
                className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  mitigationsApplied
                    ? 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                }`}
              >
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span>{mitigationsApplied ? 'Reset Parameters' : 'Simulate Safety Mitigation Impact'}</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
