import { Capacitor } from '@capacitor/core';
import { apiPost } from './api';

const STORAGE_KEY = 'push.fcmToken.v1';
const STORAGE_LAST_SENT_KEY = 'push.fcmTokenLastSent.v1';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function getStoredFcmToken(): Promise<string | null> {
  return safeGet(STORAGE_KEY);
}

export async function setStoredFcmToken(token: string | null): Promise<void> {
  safeSet(STORAGE_KEY, token);
}

/**
 * Best-effort: send the token to the backend if changed.
 *
 * Backend route already exists: POST /utilisateurs/me/fcm-token { fcmToken }
 */
export async function sendFcmTokenToBackendIfNeeded(token: string): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') {
    console.log('[push] skip token sync on web');
    return;
  }

  const lastSent = safeGet(STORAGE_LAST_SENT_KEY);
  if (lastSent === token) {
    console.log('[push] token already sent to backend (no change)');
    return;
  }

  console.log('[push] sending token to backend…');
  try {
    await apiPost('/utilisateurs/me/fcm-token', { fcmToken: token });
    safeSet(STORAGE_LAST_SENT_KEY, token);
    console.log('[push] token synced to backend');
  } catch (e) {
    console.warn('[push] token sync failed (will retry on next start)', e);
    // don't mark as sent
  }
}

