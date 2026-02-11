import { Injectable, Logger } from '@nestjs/common';
import { firestore } from '../firebase-admin';

type EmailUidDoc = {
  uid?: unknown;
  email?: unknown;
  updatedAt?: unknown;
};

@Injectable()
export class FirestoreEmailUidService {
  private readonly logger = new Logger(FirestoreEmailUidService.name);

  static readonly COLLECTION = 'email_uid';

  private normalizeEmail(email: string): string {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  async getUidForEmail(emailRaw: string): Promise<string | null> {
    const email = this.normalizeEmail(emailRaw);
    if (!email) return null;

    try {
      const snap = await firestore
        .collection(FirestoreEmailUidService.COLLECTION)
        .doc(email)
        .get();
      if (!snap.exists) return null;

      const raw: unknown = snap.data();
      const data = (raw ?? {}) as EmailUidDoc;
      const uid = data.uid;
      return typeof uid === 'string' && uid.trim() ? uid.trim() : null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed to read email_uid/${email}: ${msg}`);
      return null;
    }
  }

  async upsertEmailUid(emailRaw: string, uid: string): Promise<void> {
    const email = this.normalizeEmail(emailRaw);
    const cleanUid = String(uid || '').trim();
    if (!email || !cleanUid) return;

    try {
      await firestore
        .collection(FirestoreEmailUidService.COLLECTION)
        .doc(email)
        .set(
          {
            email,
            uid: cleanUid,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed to upsert email_uid/${email}: ${msg}`);
    }
  }

  async deleteEmail(emailRaw: string): Promise<void> {
    const email = this.normalizeEmail(emailRaw);
    if (!email) return;
    try {
      await firestore
        .collection(FirestoreEmailUidService.COLLECTION)
        .doc(email)
        .delete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed to delete email_uid/${email}: ${msg}`);
    }
  }
}
