'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'RESPONSER' | 'ENGINEER' | 'ANALYST' | 'COMMUTER';
export type MapStyle = 'carto_dark' | 'carto_light' | 'osm_standard' | 'satellite';
export type ThemeColor = 'cyber_cyan' | 'emerald_matrix' | 'neon_amber' | 'oled_black';
export type ThemeMode = 'dark' | 'light';

interface UserPreferences {
  role: UserRole;
  mapStyle: MapStyle;
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  riskThreshold: number;
  soundAlertsEnabled: boolean;
  autoFlyToLocation: boolean;
  compactHudMode: boolean;
  setRole: (role: UserRole) => void;
  setMapStyle: (style: MapStyle) => void;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setRiskThreshold: (val: number) => void;
  setSoundAlertsEnabled: (val: boolean) => void;
  setAutoFlyToLocation: (val: boolean) => void;
  setCompactHudMode: (val: boolean) => void;
}

const UserPreferencesContext = createContext<UserPreferences | undefined>(undefined);

/** Shape persisted to localStorage; every field is optional. */
type StoredPrefs = Partial<Pick<UserPreferences,
  'role' | 'mapStyle' | 'themeColor' | 'themeMode' | 'riskThreshold'
  | 'soundAlertsEnabled' | 'autoFlyToLocation' | 'compactHudMode'>>;

/** Reads persisted preferences, or null when absent or unreadable. */
async function readStoredPrefs(): Promise<StoredPrefs | null> {
  try {
    const saved = localStorage.getItem('roadwatch_user_prefs');
    return saved ? (JSON.parse(saved) as StoredPrefs) : null;
  } catch {
    return null;
  }
}

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('ENGINEER');
  const [mapStyle, setMapStyleState] = useState<MapStyle>('carto_dark');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('cyber_cyan');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [riskThreshold, setRiskThresholdState] = useState<number>(70);
  const [soundAlertsEnabled, setSoundAlertsEnabledState] = useState<boolean>(true);
  const [autoFlyToLocation, setAutoFlyToLocationState] = useState<boolean>(true);
  const [compactHudMode, setCompactHudModeState] = useState<boolean>(false);

  // Synchronize document.documentElement class for Light/Dark mode
  const applyThemeMode = (mode: ThemeMode) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    }
  };

  // Restore stored preferences on mount.
  //
  // localStorage does not exist during server rendering, so this cannot be a
  // lazy useState initializer without a hydration mismatch. Reading it through
  // an async step keeps the state updates off the synchronous render path.
  useEffect(() => {
    let cancelled = false;

    readStoredPrefs().then((parsed) => {
      if (cancelled) return;
      if (!parsed) {
        applyThemeMode('dark');
        return;
      }
      if (parsed.role) setRoleState(parsed.role);
      if (parsed.mapStyle) setMapStyleState(parsed.mapStyle);
      if (parsed.themeColor) setThemeColorState(parsed.themeColor);
      if (parsed.themeMode) {
        setThemeModeState(parsed.themeMode);
        applyThemeMode(parsed.themeMode);
      } else {
        applyThemeMode('dark');
      }
      if (parsed.riskThreshold !== undefined) setRiskThresholdState(parsed.riskThreshold);
      if (parsed.soundAlertsEnabled !== undefined) setSoundAlertsEnabledState(parsed.soundAlertsEnabled);
      if (parsed.autoFlyToLocation !== undefined) setAutoFlyToLocationState(parsed.autoFlyToLocation);
      if (parsed.compactHudMode !== undefined) setCompactHudModeState(parsed.compactHudMode);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const savePrefs = (updates: Partial<UserPreferences>) => {
    try {
      const current = {
        role,
        mapStyle,
        themeColor,
        themeMode,
        riskThreshold,
        soundAlertsEnabled,
        autoFlyToLocation,
        compactHudMode,
        ...updates,
      };
      localStorage.setItem('roadwatch_user_prefs', JSON.stringify(current));
    } catch {}
  };

  const setRole = (r: UserRole) => {
    setRoleState(r);
    savePrefs({ role: r });
  };

  const setMapStyle = (s: MapStyle) => {
    setMapStyleState(s);
    savePrefs({ mapStyle: s });
  };

  const setThemeColor = (t: ThemeColor) => {
    setThemeColorState(t);
    savePrefs({ themeColor: t });
  };

  const setThemeMode = (m: ThemeMode) => {
    setThemeModeState(m);
    applyThemeMode(m);
    const newMapStyle = m === 'light' ? 'carto_light' : 'carto_dark';
    setMapStyleState(newMapStyle);
    savePrefs({ themeMode: m, mapStyle: newMapStyle });
  };

  const setRiskThreshold = (v: number) => {
    setRiskThresholdState(v);
    savePrefs({ riskThreshold: v });
  };

  const setSoundAlertsEnabled = (v: boolean) => {
    setSoundAlertsEnabledState(v);
    savePrefs({ soundAlertsEnabled: v });
  };

  const setAutoFlyToLocation = (v: boolean) => {
    setAutoFlyToLocationState(v);
    savePrefs({ autoFlyToLocation: v });
  };

  const setCompactHudMode = (v: boolean) => {
    setCompactHudModeState(v);
    savePrefs({ compactHudMode: v });
  };

  return (
    <UserPreferencesContext.Provider
      value={{
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
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
