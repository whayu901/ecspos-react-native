import {useEffect, useState} from 'react';
import {PermissionsAndroid} from 'react-native';
import Geolocation, {
  GeolocationError,
  GeolocationResponse,
} from '@react-native-community/geolocation';

async function requestPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Hook returning [latitude, longitude].
 * Starts tracking on mount; stops on unmount.
 */
export function useLatLongCommunity(): [number | null, number | null] {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  useEffect(() => {
    let watchId: number | null = null;

    async function start() {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.warn('Geolocation permission not granted');
        return;
      }

      Geolocation.setRNConfiguration({
        skipPermissionRequests: true,
      });

      watchId = Geolocation.watchPosition(
        (pos: GeolocationResponse) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
        },
        (err: GeolocationError) => {
          console.warn('Location error:', err.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // minimum movement (meters) for update
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    }

    start();

    return () => {
      if (watchId != null) {
        Geolocation.clearWatch(watchId);
      }
      Geolocation.stopObserving?.();
    };
  }, []);

  return [lat, lon];
}
