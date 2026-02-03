export const STORAGE_KEY = 'auth.session';

export type AuthSession = {
  token: string;
  expiresAt: string; // ISO string
  user: any;
};

/**
 * Simple async storage adapter.
 * On mobile you can replace implementations with Capacitor Secure Storage plugin.
 */
export async function setSession(session: AuthSession | null): Promise<void> {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // Best-effort; ignore storage errors
    console.warn('auth-storage: setSession failed', e);
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (e) {
    console.warn('auth-storage: getSession failed', e);
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  const s = await getSession();
  return s?.token ?? null;
}

export async function removeSession(): Promise<void> {
  await setSession(null);
}
