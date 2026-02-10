import { Capacitor } from '@capacitor/core';
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/firebase';

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function findPgUserIdByEmail(emailRaw: string): Promise<string | null> {
  const email = normalizeEmail(emailRaw);
  if (!email) return null;

  try {
    const q = query(
      collection(db, 'utilisateur'),
      where('email', '==', email),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
  } catch (e) {
    console.warn('[push] failed to resolve pg user id by email from Firestore', e);
    return null;
  }
}

/**
 * Store the current device's FCM token(s) on the Firestore user document.
 *
 * Path: users/{firebaseUid}
 * Fields:
 *  - fcmTokens: string[]
 *  - fcmTokenUpdatedAt: server timestamp
 */
export async function upsertUserFcmTokenInFirestore(params: {
  firebaseUid: string;
  token: string;
  /** Optional PG user id if known; allows writing to legacy 'utilisateur/{pgId}' doc too. */
  pgUserId?: number | string | null;
}): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') return;

  const firebaseUid = String(params.firebaseUid || '').trim();
  const token = String(params.token || '').trim();
  const pgUserIdRaw = params.pgUserId;
  const pgUserId =
    pgUserIdRaw === null || pgUserIdRaw === undefined
      ? null
      : String(pgUserIdRaw).trim();

  if (!firebaseUid || !token) return;

  const payload = {
    fcmToken: token,
    fcmTokens: [token],
    fcmTokenUpdatedAt: serverTimestamp(),
    platform,
  };

  // Primary: users/{firebaseAuthUid}
  await setDoc(doc(db, 'users', firebaseUid), payload, { merge: true });

  // Legacy: utilisateur/{pgId}
  if (pgUserId) {
    await setDoc(doc(db, 'utilisateur', pgUserId), payload, { merge: true });
  }
}
