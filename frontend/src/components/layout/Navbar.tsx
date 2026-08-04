'use client';

import { useState } from 'react';
import { Map, BarChart2, Navigation, Globe, Compass, ShieldCheck, SlidersHorizontal, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocationContext } from '@/context/LocationContext';
import { useUserPreferences } from '@/context/UserPreferencesContext';
import GlobalLocationSearch from './GlobalLocationSearch';
import DataSourceSelector from './DataSourceSelector';
import RoadWatchLogo from '../ui/RoadWatchLogo';
import SafetyAuditDrawer from '../analytics/SafetyAuditDrawer';
import PersonalizationDrawer from './PersonalizationDrawer';

export default function Navbar() {
  const pathname = usePathname();
  const { location, loading, enableGps, clearLocation } = useLocationContext();
  const { themeMode, setThemeMode } = useUserPreferences();

  const [auditOpen, setAuditOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const navItems = [
    { name: 'Live Map', path: '/', icon: Map },
    { name: 'Pattern Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Route Safety', path: '/routes', icon: Navigation },
  ];

  return (
    <>
      <header className="h-14 glass-panel border-b border-white/10 z-50 grid grid-cols-12 items-center px-5 shrink-0 relative gap-4 shadow-xl">
        {/* LEFT SECTION (Col 1-4): Brand Identity, Location Badge & Data Source Selector */}
        <div className="col-span-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <RoadWatchLogo size={30} className="group-hover:scale-105 transition-transform duration-300" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1 font-heading">
                Road<span className="text-cyan-400">Watch</span>
              </h1>
            </div>
          </Link>

          {/* Data Source Selector */}
          <DataSourceSelector />

          {location ? (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 font-mono">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[100px]">{location.city}</span>
              <button
                onClick={clearLocation}
                title="Reset location"
                className="ml-0.5 text-white/40 hover:text-red-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={enableGps}
              disabled={loading}
              className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white/80 transition-all"
            >
              <Compass className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Locate</span>
            </button>
          )}
        </div>

        {/* CENTER SECTION (Col 5-8): EXACT MIDDLE Search Bar */}
        <div className="col-span-4 flex justify-center w-full max-w-lg mx-auto">
          <GlobalLocationSearch />
        </div>

        {/* RIGHT SECTION (Col 9-12): Light/Dark Quick Toggle, Personalize Trigger, Audit Trigger & Segmented Nav */}
        <div className="col-span-4 flex justify-end items-center gap-2">
          {/* Quick Light / Dark Theme Toggle Button */}
          <button
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
            className="p-2 rounded-xl glass-panel text-white/80 hover:text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
          >
            {themeMode === 'light' ? (
              <Moon className="w-4 h-4 text-slate-800" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            onClick={() => setPrefsOpen(true)}
            title="Operational Personalization"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">Personalize</span>
          </button>

          <button
            onClick={() => setAuditOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safety Audit</span>
          </button>

          <nav className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 shrink-0">
            {navItems.map((tab) => {
              const isActive = pathname === tab.path;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,212,255,0.25)]' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-white/50'}`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Personalization & Safety Audit Drawers */}
      <PersonalizationDrawer isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} />
      <SafetyAuditDrawer isOpen={auditOpen} onClose={() => setAuditOpen(false)} />
    </>
  );
}
