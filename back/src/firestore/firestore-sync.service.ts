import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { firestore } from '../firebase-admin';
import { Role } from '../roles/role.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Session } from '../sessions/session.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';

@Injectable()
export class FirestoreSyncService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreSyncService.name);
  constructor(private readonly ds: DataSource) {}

  async onModuleInit() {
    // Run a full sync at startup (best-effort)
    try {
      await this.syncAll();
      this.logger.log('Initial Firestore sync completed');
    } catch (e) {
      this.logger.warn('Firestore sync failed at startup: ' + String(e?.message ?? e));
    }
  }

  private async syncEntity(entity: any) {
    const repo = this.ds.getRepository(entity);
    const rows = await repo.find();
    const collectionName = repo.metadata.tableName || entity.name;
    const col = firestore.collection(collectionName);
    for (const row of rows) {
      const id = (row as any).id ?? (row as any)[repo.metadata.primaryColumns[0].propertyName];
      const data = JSON.parse(JSON.stringify(row, (_k, v) => (v instanceof Date ? v.toISOString() : v)));
      await col.doc(String(id)).set(data, { merge: true });
    }
    this.logger.log(`Synced ${rows.length} records to Firestore collection '${collectionName}'`);
  }

  async syncAll() {
    // Add here the entities you want to sync
    const entities = [Role, Utilisateur, Entreprise, Signalement, Session, StatutCompte];
    for (const e of entities) {
      try {
        await this.syncEntity(e);
      } catch (err) {
        this.logger.warn(`Failed to sync entity ${e.name}: ${String(err?.message ?? err)}`);
      }
    }
  }
}
