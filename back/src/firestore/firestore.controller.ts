import { Controller, Post } from '@nestjs/common';
import { FirestoreSyncService } from './firestore-sync.service';

@Controller('firestore')
export class FirestoreController {
  constructor(private readonly sync: FirestoreSyncService) {}

  @Post('sync')
  async syncAll() {
    await this.sync.syncAll();
    return { status: 'ok' };
  }

  @Post('import')
  async importAll() {
    const signalements = await this.sync.importSignalementsFromFirestore();
    const historiques = await this.sync.importHistoriquesSignalementFromFirestore();
    return { status: 'ok', imported: { signalements, historiques } };
  }
}
