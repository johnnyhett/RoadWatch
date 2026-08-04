'use client';

import { useUserPreferences, UserRole, MapStyle, ThemeColor, ThemeMode } from '@/context/UserPreferencesContext';
import { Settings, Shield, Sliders, Volume2, Eye, Map, X, Check, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLES: { id: UserRole; title: string; desc: string; icon: string }[] = [
  { id: 'ENGINEER', title: 'Highway Civil Engineer', desc: 'Prioritizes countermeasures & infrastructure risk scores', icon: '🏗️' },
  { id: 'RESPONSER', title: 'Emergency Dispatch', desc: 'Emphasizes live telemetry feed & fatal incident alerts', icon: '🚓' },
  { id: 'ANALYST', title: 'Traffic Data Analyst', desc: 'Displays FP-Growth association rules & KDE heatmaps', icon: '📊' },
  { id: 'COMMUTER', title: 'Daily Commuter', desc: 'Focuses on safest route navigation & weather delays', icon: '🚗' },
];

const THEME_COLORS: { id: ThemeColor; label: string; bg: string }[] = [
  { id: 'cyber_cyan', label: 'Cyber Cyan', bg: 'from-cyan-500 to-blue-600' },
  { id: 'emerald_matrix', label: 'Emerald Matrix', bg: 'from-emerald-500 to-teal-600' },
  { id: 'neon_amber', label: 'Neon Amber', bg: 'from-amber-500 to-orange-600' },
  { id: 'oled_black', label: 'OLED Black', bg: 'from-slate-900 to-black' },
];

interface PersonalizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalizationDrawer({ isOpen, onClose }: PersonalizationDrawerProps) {
  const {
    role,
    mapStyle,
    themeColor,
    themeMode,
    riskThreshold,
    soundAlertsEnabled,
    autoFlyToLocation,
    compactHudMode,
    setRole,
    setMapStyle,
    setThemeColor,
    setThemeMode,
    setRiskThreshold,
    setSoundAlertsEnabled,
    setAutoFlyToLocation,
    setCompactHudMode,
  } = useUserPreferences();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-[#0b0f19] border-l border-white/10 h-full overflow-y-auto custom-scrollbar p-6 space-y-6 text-white shadow-2xl flex flex-col justify-between"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                <Settings className="w-5 h-5 text-cyan-400" /> Operational Personalization
              </h2>
              <p className="text-xs text-white/50 font-mono">Tailor HUD metrics, theme mode, and alert rules</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg glass-panel text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 0: Light Mode vs Dark Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-cyan-400" /> Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10 font-mono text-xs">
              <button
                onClick={() => setThemeMode('dark')}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  themeMode === 'dark'
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark Mode
              </button>
              <button
                onClick={() => setThemeMode('light')}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  themeMode === 'light'
                    ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <Sun className="w-4 h-4" /> Light Mode
              </button>
            </div>
          </div>

          {/* Section 1: Operational Role */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Operational Role Profile
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
                    role === r.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-heading">{r.title}</span>
                      {role === r.id && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Color Theme Preset */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Accent Palette
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {THEME_COLORS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeColor(t.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 font-mono text-xs transition-all ${
                    themeColor === t.id
                      ? 'border-cyan-400 bg-cyan-500/10 text-white shadow-[0_0_10px_rgba(0,212,255,0.2)] font-bold'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${t.bg} shrink-0`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Risk Alert Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Risk Alert Threshold
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">{riskThreshold} / 100</span>
            </div>
            <input
              type="range"
              min={30}
              max={95}
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
              className="w-full accent-cyan-400 bg-white/10 rounded-lg h-1.5 cursor-pointer"
            />
            <p className="text-[10px] text-white/50 font-mono">
              Triggers visual high-priority alerts when corridor risk exceeds {riskThreshold} score.
            </p>
          </div>

          {/* Section 4: System Toggles */}
          <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-white font-medium block">Live Audio Telemetry Beep</span>
                  <span className="text-[10px] text-white/50 font-mono font-normal">Play audible cue on new high-severity crash</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundAlertsEnabled}
                onChange={(e) => setSoundAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-white font-medium block">Auto Camera Location Fly-To</span>
                  <span className="text-[10px] text-white/50 font-mono font-normal">Automatically transit map upon region selection</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoFlyToLocation}
                onChange={(e) => setAutoFlyToLocation(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.4)] mt-6"
        >
          Save & Apply Operational Preferences
        </button>
      </motion.div>
    </div>
  );
}
