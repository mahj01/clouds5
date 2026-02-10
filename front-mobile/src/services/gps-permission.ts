import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export async function checkAndRequestGPSPermission() {
  if (Capacitor.getPlatform() === 'android') {
    try {
      console.log('[gps] checking permissions');
      const permissionStatus = await Geolocation.checkPermissions();
      console.log('[gps] current permission', permissionStatus);

      if (permissionStatus.location != 'granted') {
        console.log('[gps] requesting permission…');
        const requestStatus = await Geolocation.requestPermissions();
        console.log('[gps] permission request result', requestStatus);

        if (requestStatus.location === 'denied') {
          console.warn('[gps] permission denied. The app may not function properly.');
        } else {
          console.log('[gps] permission granted.');
        }
      } else {
        console.log('[gps] permission already granted.');
      }
    } catch (error) {
      console.error('[gps] error checking or requesting permission:', error);
      throw error;
    }
  } else {
    console.log('[gps] permission check is only required on Android.');
  }
}
