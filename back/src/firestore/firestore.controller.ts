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
}
