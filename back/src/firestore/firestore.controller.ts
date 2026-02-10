import { Controller, Post, Query } from '@nestjs/common';
import { FirestoreSyncService } from './firestore-sync.service';
import { FirestoreDiffSyncService } from './firestore-diff-sync.service';

@Controller('firestore')
export class FirestoreController {
  constructor(
    private readonly sync: FirestoreSyncService,
    private readonly diffSync: FirestoreDiffSyncService,
  ) {}

  @Post('sync')
  async syncAll() {
    return this.sync.syncAll();
  }

  @Post('full-sync')
  async fullSync() {
    // Synchronisation bidirectionnelle complète
    const syncResult = await this.sync.syncAll();
    const signalementResult = await this.sync.syncSignalementsFromFirestore();
    return {
      message: 'Synchronisation complète terminée',
      sync: syncResult,
      signalements: signalementResult,
    };
  }

  @Post('sync-signalements')
  async syncSignalements() {
    return this.sync.syncSignalementsFromFirestore();
  }

  /** Push status diffs (HistoriqueSignalement) to Firestore with minimal reads/writes */
  @Post('flush-status-diffs')
  async flushStatusDiffs(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 50;
    return this.diffSync.flushPendingStatusDiffs(Number.isFinite(n) ? n : 50);
  }
}
