import { PushNotifications } from '@capacitor/push-notifications';
import { setStoredFcmToken, sendFcmTokenToBackendIfNeeded } from './push-token-sync';

let inFlightRegistration: Promise<string> | null = null;
let listenersAttached = false;

function attachInternalRegistrationListenersOnce() {
  if (listenersAttached) return;
  listenersAttached = true;

  // Always keep the latest token locally, and try to sync to backend.
  PushNotifications.addListener('registration', (t) => {
    const token = t?.value;
    console.log('[push] registration listener (global) received', token ? token.slice(0, 12) + '…' : '(empty)');
    if (!token) return;

    void setStoredFcmToken(token);
    void sendFcmTokenToBackendIfNeeded(token);
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.warn('[push] registrationError listener (global)', err);
  });
}

/**
 * Registers the device for push notifications and returns the FCM token.
 *
 * - On Android (with google-services.json configured) this will be an FCM token.
 * - Must be called on a real device/emulator with Google Play services.
 */
export async function registerForPushNotifications(): Promise<string> {
  // Prevent concurrent calls (can cause subtle plugin issues on some devices)
  if (inFlightRegistration) return inFlightRegistration;

  // Ensure we capture token refresh events even if caller doesn't wait
  attachInternalRegistrationListenersOnce();

  inFlightRegistration = (async () => {
    try {
      console.log('[push] starting registration flow');

      // Check current permissions first (so we can log + avoid unnecessary prompts)
      const currentPerm = await PushNotifications.checkPermissions();
      console.log('[push] current permission', currentPerm);

      if (currentPerm.receive !== 'granted') {
        console.log('[push] requesting permission…');
        const permStatus = await PushNotifications.requestPermissions();
        console.log('[push] permission request result', permStatus);

        if (permStatus.receive !== 'granted') {
          throw new Error('Push notification permission not granted');
        }
      } else {
        console.log('[push] permission already granted');
      }

      console.log('[push] calling PushNotifications.register()');
      await PushNotifications.register();

      // Wait for token (the per-call listener makes this function deterministic)
      const token = await new Promise<string>((resolve, reject) => {
        let regHandle: any;
        let errHandle: any;

        void PushNotifications.addListener('registration', (t) => {
          console.log('[push] registration event received (per-call)');
          resolve(t.value);
          try {
            void regHandle?.remove?.();
            void errHandle?.remove?.();
          } catch {
            // ignore
          }
        }).then((h) => {
          regHandle = h;
        });

        void PushNotifications.addListener('registrationError', (err) => {
          console.warn('[push] registrationError event received (per-call)', err);
          reject(new Error(JSON.stringify(err)));
          try {
            void regHandle?.remove?.();
            void errHandle?.remove?.();
          } catch {
            // ignore
          }
        }).then((h) => {
          errHandle = h;
        });
      });

      console.log('[push] got token', token ? token.slice(0, 12) + '…' : '(empty)');

      // Persist + sync (best-effort)
      await setStoredFcmToken(token);
      await sendFcmTokenToBackendIfNeeded(token);

      return token;
    } finally {
      inFlightRegistration = null;
    }
  })();

  return inFlightRegistration;
}

/**
 * Call on app start (after other permissions) to:
 * - attach listeners (token refresh)
 * - register if permission is already granted
 *
 * It won’t prompt the user.
 */
export async function bootstrapPushNotifications(): Promise<void> {
  attachInternalRegistrationListenersOnce();

  try {
    const perm = await PushNotifications.checkPermissions();
    console.log('[push] bootstrap check permission', perm);

    if (perm.receive === 'granted') {
      console.log('[push] bootstrap: permission granted, registering for token refresh');
      await PushNotifications.register();
    } else {
      console.log('[push] bootstrap: permission not granted yet (will register when requested)');
    }
  } catch (e) {
    console.warn('[push] bootstrap failed', e);
  }
}

/** Optional: attach runtime listeners for debug / foreground notifications */
export function attachPushListeners(opts?: {
  onNotification?: (notification: any) => void;
  onAction?: (action: any) => void;
}) {
  attachInternalRegistrationListenersOnce();

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[push] pushNotificationReceived', notification);
    opts?.onNotification?.(notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[push] pushNotificationActionPerformed', notification);
    opts?.onAction?.(notification);
  });
}
