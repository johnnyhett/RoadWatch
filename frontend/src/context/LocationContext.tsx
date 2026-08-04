'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserLocation } from '@/types';
import { setGlobalLocationCenter } from '@/lib/api';

interface LocationContextType {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  flyToCoords: [number, number] | null;
  enableGps: () => Promise<void>;
  clearLocation: () => void;
  selectLocation: (loc: UserLocation) => void;
  setFlyToCoords: (coords: [number, number] | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flyToCoords, setFlyToCoordsState] = useState<[number, number] | null>(null);

  const selectLocation = useCallback((loc: UserLocation) => {
    setLocationState(loc);
    setGlobalLocationCenter(loc.latitude, loc.longitude);
    setFlyToCoordsState([loc.latitude, loc.longitude]);
    try {
      sessionStorage.setItem('user_location', JSON.stringify(loc));
    } catch (e) {}
  }, []);

  // IP Geolocation fallback query with granular city & region resolution
  const fetchIpLocation = async (): Promise<UserLocation | null> => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const d = await res.json();
        if (d.latitude && d.longitude) {
          return {
            latitude: d.latitude,
            longitude: d.longitude,
            city: d.city || d.region || 'Kumasi',
            country: d.country_name || 'Ghana',
          };
        }
      }
    } catch (e) {}

    try {
      const res2 = await fetch('http://ip-api.com/json/');
      if (res2.ok) {
        const d = await res2.json();
        if (d.lat && d.lon) {
          return {
            latitude: d.lat,
            longitude: d.lon,
            city: d.city || 'Kumasi',
            country: d.country || 'Ghana',
          };
        }
      }
    } catch (e) {}

    return null;
  };

  const enableGps = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Try HTML5 Geolocation API first
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const gpsPromise = new Promise<UserLocation | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            let city = 'Kumasi';
            let country = 'Ghana';

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
              );
              if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential;
                const town = addr.city || addr.town || addr.village || addr.county || addr.state;
                
                city = neighborhood && town ? `${neighborhood}, ${town}` : town || neighborhood || 'Kumasi';
                country = addr.country || 'Ghana';
              }
            } catch (e) {}

            resolve({
              latitude,
              longitude,
              city,
              country,
              accuracy,
              timestamp: position.timestamp,
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
      });

      const gpsLoc = await gpsPromise;
      if (gpsLoc) {
        selectLocation(gpsLoc);
        setLoading(false);
        return;
      }
    }

    // IP-based Geolocation fallback if GPS permission is denied/delayed
    const ipLoc = await fetchIpLocation();
    if (ipLoc) {
      selectLocation(ipLoc);
    } else {
      // Default to Kumasi, Ghana [6.6885, -1.6244]
      selectLocation({
        latitude: 6.6885,
        longitude: -1.6244,
        city: 'Kumasi',
        country: 'Ghana',
      });
    }
    setLoading(false);
  }, [selectLocation]);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    setFlyToCoordsState([6.6885, -1.6244]);
    setGlobalLocationCenter(6.6885, -1.6244);
    try {
      sessionStorage.removeItem('user_location');
    } catch (e) {}
  }, []);

  // Auto-detect exact location on initial load
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('user_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocationState(parsed);
        setGlobalLocationCenter(parsed.latitude, parsed.longitude);
        setFlyToCoordsState([parsed.latitude, parsed.longitude]);
      } else {
        enableGps();
      }
    } catch (e) {
      enableGps();
    }
  }, [enableGps]);

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        flyToCoords,
        enableGps,
        clearLocation,
        selectLocation,
        setFlyToCoords: setFlyToCoordsState,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
