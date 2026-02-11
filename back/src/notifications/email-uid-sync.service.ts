import { Injectable, Logger } from '@nestjs/common';
import admin, { firestore } from '../firebase-admin';
import { DataSource, IsNull, Not } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

export type EmailUidSyncResult = {
  totalWritten: number;
};

@Injectable()
export class EmailUidSyncService {
  private readonly logger = new Logger(EmailUidSyncService.name);
  private inFlight: Promise<EmailUidSyncResult> | null = null;

  constructor(private readonly ds: DataSource) {}

  static readonly COLLECTION = 'email_uid';
  static readonly LOCK_DOC_PATH = 'locks/email_uid_sync';

  private normalizeEmail(email: string) {
    return String(email || '').trim().toLowerCase();
  }

  /**
   * Syncs Postgres Utilisateur rows (email + firebaseUid) into Firestore collection `email_uid`.
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

  private async runSync(options?: {
    pageSize?: number;
    leaseMs?: number;
    reason?: string;
  }): Promise<EmailUidSyncResult> {
    const pageSize = options?.pageSize ?? 1000;
    const leaseMs = options?.leaseMs ?? 10 * 60 * 1000;
    const reason = options?.reason ?? 'manual';

    const lockRef = firestore.doc(EmailUidSyncService.LOCK_DOC_PATH);
    const leaseUntil = Date.now() + leaseMs;

    const lockAcquired = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      const data = (snap.data() ?? {}) as { leaseUntil?: number };
      if (typeof data.leaseUntil === 'number' && data.leaseUntil > Date.now()) return false;

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

    let totalWritten = 0;
    this.logger.log(`Starting email->uid sync (reason=${reason})...`);

    try {
      const repo = this.ds.getRepository(Utilisateur);

      let skip = 0;
      while (true) {
        const users = await repo.find({
          select: ['id', 'email', 'firebaseUid'],
          where: { firebaseUid: Not(IsNull()) },
          order: { id: 'ASC' },
          skip,
          take: pageSize,
        });

        if (!users.length) break;
        skip += users.length;

        const batch = firestore.batch();
        let batchCount = 0;

        for (const u of users) {
          const email = this.normalizeEmail(String(u.email || ''));
          const uid = String(u.firebaseUid || '').trim();
          if (!email || !uid) continue;

          const ref = firestore.collection(EmailUidSyncService.COLLECTION).doc(email);
          batch.set(
            ref,
            {
              email,
              uid,
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
      }

      this.logger.log(`Email->uid sync done. total mappings: ${totalWritten}`);
      return { totalWritten };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn('Email->uid sync failed: ' + msg);
      throw e;
    } finally {
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
