'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'RESPONSER' | 'ENGINEER' | 'ANALYST' | 'COMMUTER';
export type MapStyle = 'carto_dark' | 'carto_light' | 'osm_standard' | 'satellite';
export type ThemeColor = 'cyber_cyan' | 'emerald_matrix' | 'neon_amber' | 'oled_black';

interface UserPreferences {
  role: UserRole;
  mapStyle: MapStyle;
  themeColor: ThemeColor;
  riskThreshold: number; // 0-100 score threshold for alerts
  soundAlertsEnabled: boolean;
  autoFlyToLocation: boolean;
  compactHudMode: boolean;
  setRole: (role: UserRole) => void;
  setMapStyle: (style: MapStyle) => void;
  setThemeColor: (color: ThemeColor) => void;
  setRiskThreshold: (val: number) => void;
  setSoundAlertsEnabled: (val: boolean) => void;
  setAutoFlyToLocation: (val: boolean) => void;
  setCompactHudMode: (val: boolean) => void;
}

const UserPreferencesContext = createContext<UserPreferences | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('ENGINEER');
  const [mapStyle, setMapStyleState] = useState<MapStyle>('carto_dark');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('cyber_cyan');
  const [riskThreshold, setRiskThresholdState] = useState<number>(70);
  const [soundAlertsEnabled, setSoundAlertsEnabledState] = useState<boolean>(true);
  const [autoFlyToLocation, setAutoFlyToLocationState] = useState<boolean>(true);
  const [compactHudMode, setCompactHudModeState] = useState<boolean>(false);

  // Load stored preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('roadwatch_user_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setRoleState(parsed.role);
        if (parsed.mapStyle) setMapStyleState(parsed.mapStyle);
        if (parsed.themeColor) setThemeColorState(parsed.themeColor);
        if (parsed.riskThreshold !== undefined) setRiskThresholdState(parsed.riskThreshold);
        if (parsed.soundAlertsEnabled !== undefined) setSoundAlertsEnabledState(parsed.soundAlertsEnabled);
        if (parsed.autoFlyToLocation !== undefined) setAutoFlyToLocationState(parsed.autoFlyToLocation);
        if (parsed.compactHudMode !== undefined) setCompactHudModeState(parsed.compactHudMode);
      }
    } catch (e) {
      console.error('Failed to parse user preferences:', e);
    }
  }, []);

  const savePrefs = (updates: Partial<UserPreferences>) => {
    try {
      const current = {
        role,
        mapStyle,
        themeColor,
        riskThreshold,
        soundAlertsEnabled,
        autoFlyToLocation,
        compactHudMode,
        ...updates,
      };
      localStorage.setItem('roadwatch_user_prefs', JSON.stringify(current));
    } catch (e) {}
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
        riskThreshold,
        soundAlertsEnabled,
        autoFlyToLocation,
        compactHudMode,
        setRole,
        setMapStyle,
        setThemeColor,
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
