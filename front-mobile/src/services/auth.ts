import { getSession, setSession, removeSession, AuthSession } from './auth-storage';

// Firebase-first auth for mobile app
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/firebase';

import { getAccountStatus, markLoginFailure, markLoginSuccess } from './auth-attempts';
import { getUidForEmail, upsertEmailUid } from './auth-identity';
import { firebaseEmailExists } from './auth-email-exists';

export type NormalizedResult<T> =
  | { ok: true; data: T }
  | { ok: false, error: AuthError };

export type AuthError = {
  message: string;
  code?: string;
  remainingAttempts?: number | null;
  isLocked?: boolean;
  original?: any;
};

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Strictly-online login (Firebase only) with Firestore lockout.
 * Data model:
 * - `statut_compte_utilisateur/{uid}`: { statut: 'actif'|'bloqué', consecutive_failed_attempts }
 *
 * Note: in the pure client-side Firebase Auth SDK, on a wrong-password/invalid-credential error
 * we cannot reliably obtain the target user's uid. That means we can only enforce lockout by uid
 * once the user is successfully authenticated.
 */
export async function loginOnline(emailRaw: string, motDePasse: string): Promise<NormalizedResult<AuthSession>> {
  const email = normalizeEmail(emailRaw);

  try {
    // Pre-check lockout when we can resolve uid from email (best-effort).
    // This allows blocking accounts *before* validating credentials.
    try {
      const preUid = await getUidForEmail(email);
      if (preUid) {
        const preStatus = await getAccountStatus(preUid);
        if (preStatus?.statut === 'bloqué') {
          try {
            await signOut(firebaseAuth);
          } catch {
            // ignore
          }
          await removeSession();
          return {
            ok: false,
            error: {
              code: 'ACCOUNT_LOCKED',
              isLocked: true,
              remainingAttempts: 0,
              message: 'Compte bloqué. Contactez un administrateur.',
            },
          };
        }
      }
    } catch {
      // If the pre-check fails (offline / permissions), fall back to normal login flow.
    }

    // Firebase auth
    await signInWithEmailAndPassword(firebaseAuth, email, motDePasse);

    const user = firebaseAuth.currentUser;
    const uid = user?.uid;
    if (!uid) {
      return { ok: false, error: { message: 'Login failed (missing uid).', code: 'UNKNOWN_ERROR' } };
    }

    // Maintain lookup index so future failed logins can be attributed.
    await upsertEmailUid(email, uid);

    // Enforce lock based on statut_compte_utilisateur
    const status = await getAccountStatus(uid);
    if (status.statut === 'bloqué') {
      try {
        await signOut(firebaseAuth);
      } catch {

      }
      await removeSession();
      return {
        ok: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          isLocked: true,
          remainingAttempts: 0,
          message: 'Compte bloqué. Contactez un administrateur.',
        },
      };
    }

    // On success, reset attempts + ensure actif
    await markLoginSuccess(uid);

    // Persist a minimal session for app usage
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const token = uid;
    const session: AuthSession = { token, expiresAt, user: { uid, email: user?.email ?? email } };
    await setSession(session);

    return { ok: true, data: session };
  } catch (e: any) {
    const firebaseCode = String(e?.code || 'UNKNOWN_ERROR');

    if (firebaseCode === 'auth/network-request-failed') {
      return {
        ok: false,
        error: {
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
          original: e,
        },
      };
    }

    // Wrong password / invalid email handling:
    // Firebase uses HTTP 400 for invalid credentials; in SDK it usually surfaces as
    // 'auth/invalid-credential' (and sometimes 'auth/wrong-password' or 'auth/user-not-found').
    // This is the moment we start the attempt log flow.
    const isInvalidCred =
      firebaseCode === 'auth/invalid-credential' ||
      firebaseCode === 'auth/wrong-password' ||
      firebaseCode === 'auth/user-not-found' ||
      firebaseCode === 'auth/invalid-email';

    if (isInvalidCred) {
      console.info('[loginOnline] invalid credentials for', email, 'firebaseCode=', firebaseCode)

      const exists = await firebaseEmailExists(email);
      console.info('[loginOnline] email exists in Firebase Auth?', exists)
      if (!exists) {
        return {
          ok: false,
          error: {
            message: 'Invalid email or password.',
            code: 'INVALID_CREDENTIALS',
            remainingAttempts: null,
            isLocked: false,
            original: e,
          },
        };
      }

      const uid = await getUidForEmail(email);
      console.info('[loginOnline] uid from email_uid lookup:', uid)
      if (uid) {
        try {
          const { locked, remainingAttempts } = await markLoginFailure(uid);
          console.info('[loginOnline] markLoginFailure result:', { locked, remainingAttempts })
          if (locked) {
            try {
              await signOut(firebaseAuth);
            } catch {
              // ignore
            }
            await removeSession();
            return {
              ok: false,
              error: {
                code: 'ACCOUNT_LOCKED',
                isLocked: true,
                remainingAttempts: 0,
                message: 'Compte bloqué. Contactez un administrateur.',
                original: e,
              },
            };
          }

          return {
            ok: false,
            error: {
              message: 'Invalid email or password.',
              code: 'INVALID_CREDENTIALS',
              remainingAttempts,
              isLocked: false,
              original: e,
            },
          };
        } catch (err) {
          console.error('[loginOnline] markLoginFailure failed', err)
          throw err
        }
      }

      // Email exists but mapping missing => cannot attribute without registration-time mapping.
      return {
        ok: false,
        error: {
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
          remainingAttempts: null,
          isLocked: false,
          original: e,
        },
      };
    }

    return {
      ok: false,
      error: {
        message: 'Login failed. Please try again.',
        code: 'UNKNOWN_ERROR',
        original: e,
      },
    };
  }
}

export async function firebaseLogout(): Promise<void> {
  await signOut(firebaseAuth);
  await removeSession();
}

/** Subscribe to Firebase auth state changes. Returns an unsubscribe function. */
export function onFirebaseAuthStateChange(cb: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, cb);
}

export async function logout(): Promise<void> {
  await removeSession();
}

export async function getCurrentUser(): Promise<any | null> {
  const s = await getSession();
  return s?.user ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  if (!s.expiresAt) return true; // no expiry -> treat as valid
  const exp = Date.parse(s.expiresAt);
  if (isNaN(exp)) return true;
  return Date.now() < exp;
}

export function getRemainingAttemptsFromError(err: any): number | null {
  if (!err) return null;
  if (typeof err.remainingAttempts === 'number') return err.remainingAttempts;
  return null;
}

export default {
  loginOnline,
  firebaseLogout,
  onFirebaseAuthStateChange,
  logout,
  getCurrentUser,
  isAuthenticated,
  getRemainingAttemptsFromError,
};
