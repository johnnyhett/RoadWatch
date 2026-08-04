'use client';

import { useState } from 'react';
import { predictRisk } from '@/lib/api';
import { RiskFeatures, RiskPrediction } from '@/types';
import { Zap, AlertTriangle, Activity } from 'lucide-react';
import GlowButton from '../ui/GlowButton';
import { motion } from 'framer-motion';

export default function RiskPredictor() {
  const [weather, setWeather] = useState('Raining');
  const [light, setLight] = useState('Darkness_Unlit');
  const [roadType, setRoadType] = useState('Motorway');
  const [speedLimit, setSpeedLimit] = useState(60);
  const [junction, setJunction] = useState('T_Junction');
  const [hour, setHour] = useState(23);

  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await predictRisk({
        weather,
        light,
        road_type: roadType,
        speed_limit: speedLimit,
        junction,
        hour,
        day_of_week: 5,
      });
      setPrediction(res);
    } catch (err) {
      console.error('Risk prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" /> Crash Risk Estimator
          </h2>
          <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10 text-xs font-medium">
            XGBoost Model
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Weather Selector */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Weather Condition</label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Clear">Clear / Fair</option>
              <option value="Raining">Raining / Heavy Rain</option>
              <option value="Snowing">Snow / Sleet</option>
              <option value="Fog">Fog / Dense Mist</option>
            </select>
          </div>

          {/* Light Condition */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Lighting Environment</label>
            <select
              value={light}
              onChange={(e) => setLight(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Daylight">Daylight</option>
              <option value="Darkness_Lit">Darkness (Streetlights Lit)</option>
              <option value="Darkness_Unlit">Darkness (Unlit Road)</option>
            </select>
          </div>

          {/* Road Classification */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Road Type</label>
            <select
              value={roadType}
              onChange={(e) => setRoadType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Motorway">Motorway / Express</option>
              <option value="A_Road">A-Road Primary</option>
              <option value="B_Road">B-Road Secondary</option>
              <option value="Residential">Residential Sector</option>
            </select>
          </div>

          {/* Speed Limit */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Speed Limit (mph)</label>
            <select
              value={speedLimit}
              onChange={(e) => setSpeedLimit(parseInt(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value={20}>20 mph</option>
              <option value={30}>30 mph</option>
              <option value={40}>40 mph</option>
              <option value={50}>50 mph</option>
              <option value={60}>60 mph</option>
              <option value={70}>70 mph</option>
            </select>
          </div>
        </div>

        <GlowButton onClick={handlePredict} disabled={loading} className="w-full py-2.5 text-xs font-semibold">
          <Activity className="w-4 h-4" />
          {loading ? 'Calculating...' : 'Calculate Risk Assessment'}
        </GlowButton>
      </div>

      {/* Model Inference Output */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-card p-4 border space-y-3 ${
            prediction.risk_level === 'HIGH'
              ? 'border-red-500/30 bg-red-500/5'
              : prediction.risk_level === 'MEDIUM'
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                prediction.risk_level === 'HIGH' ? 'text-red-400' : 'text-amber-400'
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">
                  Risk Level: <span className="text-cyan-400">{prediction.risk_level}</span>
                </h3>
                <p className="text-[11px] text-white/70">{prediction.severity_prediction}</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/80 font-medium">
              Assessment
            </span>
          </div>

          {/* Probability Bars */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
              Estimated Severity Probabilities
            </span>
            {Object.entries(prediction.probabilities || {}).map(([cls, prob]) => {
              const pct = Math.round((prob as number) * 100);
              return (
                <div key={cls} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80">{cls}</span>
                    <span className="text-white/90 font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cls === 'Fatal' ? 'bg-red-500' : cls === 'Serious' ? 'bg-orange-500' : cls === 'Slight' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
