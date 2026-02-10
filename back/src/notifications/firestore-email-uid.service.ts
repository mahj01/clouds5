import { Injectable, Logger } from '@nestjs/common';
import { firestore } from '../firebase-admin';

type EmailUidDoc = {
  uid?: unknown;
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
}
