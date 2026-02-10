import { Capacitor } from '@capacitor/core';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

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
}): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') return;

  const firebaseUid = String(params.firebaseUid || '').trim();
  const token = String(params.token || '').trim();
  if (!firebaseUid || !token) return;

  // For now we store a single-token array. If you later support multi-device,
  // you can merge using arrayUnion(). We keep it simple to avoid rules issues.
  await setDoc(
    doc(db, 'users', firebaseUid),
    {
      fcmTokens: [token],
      fcmTokenUpdatedAt: serverTimestamp(),
      platform,
    },
    { merge: true },
  );
}

