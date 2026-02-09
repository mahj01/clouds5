import { Controller, Post } from '@nestjs/common';
import { FirestoreSyncService } from './firestore-sync.service';

@Controller('firestore')
export class FirestoreController {
  constructor(private readonly sync: FirestoreSyncService) {}

  @Post('sync')
  async syncAll() {
    return this.sync.syncAll();
  }

  @Post('sync-signalements')
  async syncSignalements() {
    return this.sync.syncSignalementsFromFirestore();
  }
}
