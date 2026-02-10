import { Injectable, Logger } from '@nestjs/common';
import { firestore } from '../firebase-admin';

type FirestoreUserDoc = {
  fcmTokens?: unknown;
  fcmToken?: unknown;
};

/**
 * Reads FCM tokens stored on the Firestore user document.
 *
 * Firestore structure:
 * - users/{firebaseUid}:
 *    - fcmTokens: string[] (preferred)
 *    - fcmToken: string (legacy/single token)
 */
@Injectable()
export class FirestoreUserTokensService {
  private readonly logger = new Logger(FirestoreUserTokensService.name);

  static readonly USERS_COLLECTION = 'users';

  async getTokensForFirebaseUid(firebaseUid: string): Promise<string[]> {
    const uid = String(firebaseUid || '').trim();
    if (!uid) return [];

    try {
      const snap = await firestore
        .collection(FirestoreUserTokensService.USERS_COLLECTION)
        .doc(uid)
        .get();

      if (!snap.exists) return [];

      const raw: unknown = snap.data();
      const data = (raw ?? {}) as FirestoreUserDoc;

      const tokens: string[] = [];

      if (Array.isArray(data.fcmTokens)) {
        for (const t of data.fcmTokens) {
          if (typeof t === 'string') tokens.push(t);
        }
      }

      if (typeof data.fcmToken === 'string') {
        tokens.push(data.fcmToken);
      }

      // Deduplicate
      return Array.from(new Set(tokens.map((t) => t.trim()).filter(Boolean)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed to read user tokens for uid=${uid}: ${msg}`);
      return [];
    }
  }
}
