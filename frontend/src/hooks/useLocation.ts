import { useState, useCallback, useEffect } from 'react';
import { UserLocation } from '@/types';

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocode lat/lng to get City & Country
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city?: string; country?: string }> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'VisionZero-RoadSafetyApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county;
        const country = address.country;
        return { city, country };
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
    return {};
  };

  const enableLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const geoInfo = await reverseGeocode(latitude, longitude);

        const userLoc: UserLocation = {
          latitude,
          longitude,
          city: geoInfo.city || 'Detected Region',
          country: geoInfo.country || 'Current Area',
          accuracy,
          timestamp: position.timestamp,
        };

        setLocation(userLoc);
        setLoading(false);

        // Store in sessionStorage
        try {
          sessionStorage.setItem('user_location', JSON.stringify(userLoc));
        } catch (e) {}
      },
      (err) => {
        setLoading(false);
        setError(err.message || 'Permission denied for user location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Check stored location on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('user_location');
      if (stored) {
        setLocation(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    try {
      sessionStorage.removeItem('user_location');
    } catch (e) {}
  }, []);

  return { location, loading, error, enableLocation, clearLocation };
}
