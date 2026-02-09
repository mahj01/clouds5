import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { firestore } from '../firebase-admin';
import {
  HistoriqueSignalement,
  FirestoreSyncStatus,
} from '../historique_signalement/historique-signalement.entity';
import {
  Signalement,
  avancementFromStatut,
} from '../signalements/signalement.entity';

export type FirestoreSignalementStatusDiff = {
  signalement_pg_id: number;
  ancien_statut?: string | null;
  nouveau_statut?: string | null;
  manager_pg_id: number;
  date_changement: string; // ISO
  source: 'pg';
  version: number; // monotonically increasing per signalement (uses historique id)
};

@Injectable()
export class FirestoreDiffSyncService {
  private readonly logger = new Logger(FirestoreDiffSyncService.name);

  /** Firestore collections used by mobile/web sync */
  static readonly SIGNALMENT_COLLECTION = 'signalement';
  static readonly STATUS_DIFFS_COLLECTION = 'signalement_status_diffs';

  constructor(
    @InjectRepository(HistoriqueSignalement)
    private readonly histRepo: Repository<HistoriqueSignalement>,
    @InjectRepository(Signalement)
    private readonly sigRepo: Repository<Signalement>,
  ) {}

  /**
   * Writes one diff to Firestore in an idempotent way.
   * Doc id is deterministic: `pg_{signalementId}__h_{historiqueId}`.
   */
  private async pushOne(hist: HistoriqueSignalement): Promise<void> {
    const signalementId = hist.signalement?.id;
    const managerId = hist.manager?.id;
    if (!signalementId || !managerId) {
      throw new Error(
        `HistoriqueSignalement ${hist.id} missing relations (signalement/manager)`,
      );
    }

    const diffDocId = `pg_${signalementId}__h_${hist.id}`;

    const diff: FirestoreSignalementStatusDiff = {
      signalement_pg_id: signalementId,
      ancien_statut: hist.ancienStatut ?? null,
      nouveau_statut: hist.nouveauStatut ?? null,
      manager_pg_id: managerId,
      date_changement: (hist.dateChangement ?? new Date()).toISOString(),
      source: 'pg',
      version: hist.id,
    };

    const diffsCol = firestore.collection(
      FirestoreDiffSyncService.STATUS_DIFFS_COLLECTION,
    );
    const sigCol = firestore.collection(
      FirestoreDiffSyncService.SIGNALMENT_COLLECTION,
    );

    // 1) append diff log (idempotent)
    await diffsCol.doc(diffDocId).set(diff, { merge: true });

    // 2) always update the pg-backed mirror doc (cheap merge, no prior read)
    const sigDocId = `pg_${signalementId}`;
    const avancement = avancementFromStatut(hist.nouveauStatut ?? '');

    await sigCol.doc(sigDocId).set(
      {
        pg_id: signalementId,
        statut: hist.nouveauStatut ?? null,
        avancement,
        last_status_diff_version: hist.id,
        last_status_changed_at: diff.date_changement,
        updated_from: 'pg',
      },
      { merge: true },
    );

    // 3) update the canonical mobile-created doc.
    // Prefer the mapping stored in PG (firestoreDocId). If missing, fall back to pg_id query.
    const mappedFirestoreDocId = hist.signalement?.firestoreDocId;

    if (mappedFirestoreDocId) {
      await sigCol.doc(mappedFirestoreDocId).set(
        {
          pg_id: signalementId,
          statut: hist.nouveauStatut ?? null,
          avancement,
          last_status_diff_version: hist.id,
          last_status_changed_at: diff.date_changement,
          updated_from: 'pg',
        },
        { merge: true },
      );
      return;
    }

    // Fallback: update any mobile-created docs linked to this PG signalement via pg_id
    const linkedMobileSnap = await sigCol
      .where('pg_id', '==', signalementId)
      .get();

    if (!linkedMobileSnap.empty) {
      const batch = firestore.batch();
      for (const mobileDoc of linkedMobileSnap.docs) {
        if (mobileDoc.id === sigDocId) continue;
        batch.set(
          mobileDoc.ref,
          {
            statut: hist.nouveauStatut ?? null,
            avancement,
            last_status_diff_version: hist.id,
            last_status_changed_at: diff.date_changement,
            updated_from: 'pg',
          },
          { merge: true },
        );
      }
      await batch.commit();
    }
  }

  /**
   * Flushes pending diffs to Firestore.
   * - Uses small batches
   * - Minimal reads: only reads pending rows from PG, no Firestore reads
   */
  async flushPendingStatusDiffs(
    limit = 50,
  ): Promise<{ processed: number; synced: number; failed: number }> {
    const pending = await this.histRepo.find({
      where: {
        firestoreSyncStatus: In([
          FirestoreSyncStatus.PENDING,
          FirestoreSyncStatus.FAILED,
        ]),
      },
      relations: ['signalement', 'manager'],
      order: { id: 'ASC' },
      take: limit,
    });

    let synced = 0;
    let failed = 0;

    for (const hist of pending) {
      try {
        await this.pushOne(hist);
        hist.firestoreSyncStatus = FirestoreSyncStatus.SYNCED;
        hist.firestoreSyncedAt = new Date();
        hist.firestoreError = undefined;
        hist.firestoreAttempts = (hist.firestoreAttempts ?? 0) + 1;
        await this.histRepo.save(hist);
        synced++;
      } catch (e) {
        hist.firestoreSyncStatus = FirestoreSyncStatus.FAILED;
        const errMsg = e instanceof Error ? e.message : String(e);
        hist.firestoreError = errMsg;
        hist.firestoreAttempts = (hist.firestoreAttempts ?? 0) + 1;
        await this.histRepo.save(hist);
        failed++;
        this.logger.warn(`Failed to sync historique ${hist.id}: ${errMsg}`);
      }
    }

    return { processed: pending.length, synced, failed };
  }

  /**
   * Convenience call: enqueue by updating a signalement doc directly if needed.
   * Not used by default; we rely on HistoriqueSignalement creation.
   */
  async ensurePgSignalementMirror(signalementId: number): Promise<void> {
    const sig = await this.sigRepo.findOne({ where: { id: signalementId } });
    if (!sig) throw new Error('Signalement not found');

    const sigCol = firestore.collection(
      FirestoreDiffSyncService.SIGNALMENT_COLLECTION,
    );
    const sigDocId = `pg_${signalementId}`;

    await sigCol.doc(sigDocId).set(
      {
        pg_id: signalementId,
        statut: sig.statut,
        avancement: sig.avancement,
        updated_from: 'pg',
      },
      { merge: true },
    );
  }
}
