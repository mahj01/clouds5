import { Injectable, Logger } from '@nestjs/common';
import admin, { firestore } from '../firebase-admin';

export type EmailUidSyncResult = {
  totalWritten: number;
};

@Injectable()
export class EmailUidSyncService {
  private readonly logger = new Logger(EmailUidSyncService.name);
  private inFlight: Promise<EmailUidSyncResult> | null = null;

  static readonly COLLECTION = 'email_uid';
  static readonly LOCK_DOC_PATH = 'locks/email_uid_sync';

  private normalizeEmail(email: string) {
    return String(email || '').trim().toLowerCase();
  }

  /**
   * Syncs all Firebase Auth users into Firestore collection `email_uid`.
   * Safe & idempotent: docs keyed by normalized email, written with merge.
   */
  syncAllEmailUidMappings(options?: {
    pageSize?: number;
    leaseMs?: number;
    reason?: string;
  }): Promise<EmailUidSyncResult> {
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.runSync(options)
      .catch((e) => {
        // reset inFlight then rethrow
        throw e;
      })
      .finally(() => {
        this.inFlight = null;
      }) as Promise<EmailUidSyncResult>;

    return this.inFlight;
  }

  private hasServiceAccountCredentials(): boolean {
    // When initialized via admin.initializeApp() with application default creds,
    // firebase-admin will often have no explicit certificate credentials.
    // In local/dev this typically means serviceAccountKey.json isn't loaded.
    const app = admin.app();
    const cred: any = (app?.options as any)?.credential;
    return Boolean(cred && typeof cred === 'object' && (cred.privateKey || cred.clientEmail));
  }

  private async runSync(options?: {
    pageSize?: number;
    leaseMs?: number;
    reason?: string;
  }): Promise<EmailUidSyncResult> {
    const pageSize = options?.pageSize ?? 1000;
    const leaseMs = options?.leaseMs ?? 10 * 60 * 1000;
    const reason = options?.reason ?? 'manual';

    // If we don't have proper credentials, attempting listUsers() will fail.
    // Treat this as a configuration issue and skip the run.
    if (!this.hasServiceAccountCredentials()) {
      this.logger.warn(
        'Skipping email->uid sync: Firebase Admin SDK has no service account credentials. ' +
          'Provide GOOGLE_APPLICATION_CREDENTIALS or src/serviceAccountKey.json.',
      );
      return { totalWritten: 0 };
    }

    const lockRef = firestore.doc(EmailUidSyncService.LOCK_DOC_PATH);
    const leaseUntil = Date.now() + leaseMs;

    const lockAcquired = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      const data = (snap.data() ?? {}) as {
        leaseUntil?: number;
      };

      if (typeof data.leaseUntil === 'number' && data.leaseUntil > Date.now()) {
        return false;
      }

      tx.set(
        lockRef,
        {
          leaseUntil,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          reason,
        },
        { merge: true },
      );
      return true;
    });

    if (!lockAcquired) {
      this.logger.log('Sync already running elsewhere; skipping.');
      return { totalWritten: 0 };
    }

    let nextPageToken: string | undefined;
    let totalWritten = 0;

    this.logger.log(`Starting email->uid sync (reason=${reason})...`);

    try {
      do {
        const res = await admin.auth().listUsers(pageSize, nextPageToken);
        nextPageToken = res.pageToken;

        const batch = firestore.batch();
        let batchCount = 0;

        for (const u of res.users) {
          const email = u.email;
          if (!email) continue;

          const docId = this.normalizeEmail(email);
          if (!docId) continue;

          const ref = firestore
            .collection(EmailUidSyncService.COLLECTION)
            .doc(docId);

          batch.set(
            ref,
            {
              email: docId,
              uid: u.uid,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );

          batchCount++;
          totalWritten++;
        }

        if (batchCount > 0) {
          await batch.commit();
          this.logger.log(`Wrote ${batchCount} mappings (total ${totalWritten})`);
        }
      } while (nextPageToken);

      this.logger.log(`Email->uid sync done. total mappings: ${totalWritten}`);
      return { totalWritten };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Caller does not have required permission')) {
        this.logger.warn('Email->uid sync permission error: ' + msg);
      } else {
        this.logger.warn('Email->uid sync failed: ' + msg);
      }
      throw e;
    } finally {
      // Best-effort release. If we crash, lease expiry will free it.
      try {
        await lockRef.set(
          {
            leaseUntil: 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            reason: `released:${reason}`,
          },
          { merge: true },
        );
      } catch (e) {
        this.logger.warn('Failed to release lock: ' + String((e as any)?.message ?? e));
      }
    }
  }
}
