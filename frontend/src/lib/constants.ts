export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
export const ML_ENGINE_URL = process.env.NEXT_PUBLIC_ML_ENGINE_URL || 'http://localhost:8000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

export const MAP_CONFIG = {
  center: [6.6885, -1.6244] as [number, number], // Kumasi, Ghana
  zoom: 13,
  tileLayer: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const SEVERITY_COLORS: Record<string, string> = {
  'Fatal': '#ef4444',
  'Serious': '#f97316',
  'Slight': '#eab308',
  'Damage Only': '#10b981',
};

export const COLORS = {
  primary: '#00d4ff',
  secondary: '#38bdf8',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#10b981',
};
