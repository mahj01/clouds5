import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export async function checkAndRequestGPSPermission() {
  if (Capacitor.getPlatform() === 'android') {
    try {
      const permissionStatus = await Geolocation.checkPermissions();

      if (permissionStatus.location != 'granted') {
        const requestStatus = await Geolocation.requestPermissions();

        if (requestStatus.location === 'denied') {
          console.warn('GPS permission denied. The app may not function properly.');
        } else {
          console.log('GPS permission granted.');
        }
      } else {
        console.log('GPS permission already granted.');
      }
    } catch (error) {
      console.error('Error checking or requesting GPS permission:', error);
    }
  } else {
    console.log('GPS permission check is only required on Android.');
  }
}
