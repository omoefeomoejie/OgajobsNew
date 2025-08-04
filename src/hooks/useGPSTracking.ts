import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackMovement?: boolean;
}

export function useGPSTracking(options: GPSOptions = {}) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const { toast } = useToast();

  // Check GPS support
  const checkGPSSupport = useCallback(() => {
    const supported = 'geolocation' in navigator;
    setIsSupported(supported);
    return supported;
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!checkGPSSupport()) {
      const errorMsg = 'GPS not supported on this device';
      setError(errorMsg);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };
          
          setLocation(locationData);
          setError(null);
          resolve(locationData);
        },
        (error) => {
          const errorMsg = `Location error: ${error.message}`;
          setError(errorMsg);
          resolve(null);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 60000,
        }
      );
    });
  }, [options, checkGPSSupport]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!isSupported) return null;
    
    setIsTracking(true);
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };
        
        setLocation(locationData);
        setError(null);
      },
      (error) => {
        setError(`Tracking error: ${error.message}`);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 5000,
      }
    );
    
    return watchId;
  }, [options, isSupported]);

  // Stop tracking
  const stopTracking = useCallback((watchId: number) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    checkGPSSupport();
  }, [checkGPSSupport]);

  return {
    location,
    isTracking,
    error,
    isSupported,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
}