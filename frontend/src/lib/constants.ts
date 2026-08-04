export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

export const COLORS = {
  background: '#0a0a0f',
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceHover: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#00d4ff',
  danger: '#ff6b6b',
  warning: '#f59e0b',
  success: '#10b981',
  textPrimary: 'rgba(255, 255, 255, 0.92)',
  textSecondary: 'rgba(255, 255, 255, 0.55)',
};

export const SEVERITY_COLORS: Record<string, string> = {
  Fatal: '#ef4444',
  Serious: '#f97316',
  Slight: '#eab308',
  Damage_Only: '#22c55e',
};

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'Fatal',
  2: 'Serious',
  3: 'Slight',
  4: 'Damage Only',
};

export const MAP_CONFIG = {
  center: [51.505, -0.09] as [number, number], // London, UK — matches synthetic dataset
  zoom: 12,
  tileLayer: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
