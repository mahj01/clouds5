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
  static readonly LEGACY_UTILISATEUR_COLLECTION = 'utilisateur';

  private extractTokensFromDoc(data: FirestoreUserDoc): string[] {
    const tokens: string[] = [];

    if (Array.isArray(data.fcmTokens)) {
      for (const t of data.fcmTokens) {
        if (typeof t === 'string') tokens.push(t);
      }
    }

    if (typeof data.fcmToken === 'string') {
      tokens.push(data.fcmToken);
    }

    return Array.from(new Set(tokens.map((t) => t.trim()).filter(Boolean)));
  }

  async getTokensForFirebaseUid(firebaseUid: string): Promise<string[]> {
    const uid = String(firebaseUid || '').trim();
    if (!uid) return [];

    // 1) Preferred: users/{firebaseUid}
    try {
      const snap = await firestore
        .collection(FirestoreUserTokensService.USERS_COLLECTION)
        .doc(uid)
        .get();

      if (snap.exists) {
        const raw: unknown = snap.data();
        const data = (raw ?? {}) as FirestoreUserDoc;
        const tokens = this.extractTokensFromDoc(data);
        if (tokens.length > 0) return tokens;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed to read users/${uid} tokens: ${msg}`);
    }

    return [];
  }

  /**
   * Legacy fallback: some flows sync users into collection 'utilisateur' with docId = PG id.
   */
  async getTokensForPgUserId(pgUserId: number): Promise<string[]> {
    const id = Number(pgUserId);
    if (!Number.isFinite(id) || id <= 0) return [];

    try {
      const snap = await firestore
        .collection(FirestoreUserTokensService.LEGACY_UTILISATEUR_COLLECTION)
        .doc(String(id))
        .get();

      if (!snap.exists) return [];
      const raw: unknown = snap.data();
      const data = (raw ?? {}) as FirestoreUserDoc;
      return this.extractTokensFromDoc(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed to read utilisateur/${id} tokens: ${msg}`);
      return [];
    }
  }

  async debugCheckDocExists(params: {
    collection: string;
    docId: string;
  }): Promise<{ exists: boolean }> {
    const collection = String(params.collection || '').trim();
    const docId = String(params.docId || '').trim();
    if (!collection || !docId) return { exists: false };

    try {
      const snap = await firestore.collection(collection).doc(docId).get();
      return { exists: snap.exists };
    } catch {
      // Treat errors as non-existent for debug output; caller can log separately if needed.
      return { exists: false };
    }
  }
}
