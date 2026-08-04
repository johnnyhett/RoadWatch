'use client';

import { Map, BarChart2, Navigation, Globe, Compass } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocationContext } from '@/context/LocationContext';
import GlobalLocationSearch from './GlobalLocationSearch';
import RoadWatchLogo from '../ui/RoadWatchLogo';

export default function Navbar() {
  const pathname = usePathname();
  const { location, loading, enableGps, clearLocation } = useLocationContext();

  const navItems = [
    { name: 'Live Map', path: '/', icon: Map },
    { name: 'Pattern Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Route Safety', path: '/routes', icon: Navigation },
  ];

  return (
    <header className="h-14 bg-[#090d14] border-b border-white/10 z-50 flex items-center justify-between px-5 shrink-0 relative gap-4 shadow-xl">
      {/* Brand Identity with Custom RoadWatch Logo */}
      <Link href="/" className="flex items-center gap-3 shrink-0 group">
        <RoadWatchLogo size={32} className="group-hover:scale-105 transition-transform duration-300" />
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
            Road<span className="text-cyan-400">Watch</span>
          </h1>
          <p className="text-[9px] text-white/40 font-mono hidden sm:block">Road Safety Intelligence Engine</p>
        </div>
      </Link>

      {/* Global Location Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <GlobalLocationSearch />
      </div>

      {/* Segmented Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 shrink-0">
        {navItems.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.path}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                isActive 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,212,255,0.25)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-white/50'}`} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* GPS Location Status Badge */}
      <div className="flex items-center gap-3 shrink-0">
        {location ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 shadow-[0_0_10px_rgba(0,212,255,0.15)]">
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-semibold">{location.city || 'Region'}, {location.country || 'Global'}</span>
            <button
              onClick={clearLocation}
              title="Reset location"
              className="ml-1 text-white/40 hover:text-red-400 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={enableGps}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/40 text-xs font-medium text-white/80 transition-all"
          >
            <Compass className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Locating...' : 'Enable Location'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
