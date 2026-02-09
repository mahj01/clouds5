import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { firestore } from '../firebase-admin';
import { Role } from '../roles/role.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Session } from '../sessions/session.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';
import { HistoriqueSignalement } from '../historique_signalement/historique-signalement.entity';

/**
 * Firestore signalement document schema (canonical).
 * This matches the mobile app's expected structure.
 */
interface FirestoreSignalementDoc {
  titre: string | null;
  type_signalement: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  date_signalement_ms: number | null;
  statut: string;
  surface: number | null;
  budget: number | null;
  entreprise: string | null;
  utilisateurUid: string | null;
  firebase_signalement_id: string;
}

/**
 * Firestore historique_signalement document schema (canonical).
 * This matches the mobile app's expected structure.
 */
interface FirestoreHistoriqueSignalementDoc {
  firebase_signalement_id: string
  ancien_statut: string | null
  nouveau_statut: string | null
  date_changement_ms: number | null
  utilisateurUid: string | null
  id_manager: number | null
}

@Injectable()
export class FirestoreSyncService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreSyncService.name);
  constructor(private readonly ds: DataSource) {}

  async onModuleInit() {
    // Run a full sync at startup (best-effort)
    try {
      await this.syncAll();
      this.logger.log('Initial Firestore sync completed');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn('Firestore sync failed at startup: ' + msg);
    }
  }

  /**
   * Map a SQL Signalement entity to the Firestore document schema.
   */
  private signalementToFirestore(row: Signalement): FirestoreSignalementDoc {
    // Use the existing firebase id if present, otherwise use the SQL id as a string.
    const firebaseId = row.firebaseSignalementId ?? String(row.id);

    return {
      titre: row.titre ?? null,
      type_signalement: row.typeSignalement ?? null,
      description: row.description ?? null,
      latitude: row.latitude != null ? Number(row.latitude) : 0,
      longitude: row.longitude != null ? Number(row.longitude) : 0,
      date_signalement_ms: row.dateSignalement
        ? row.dateSignalement.getTime()
        : null,
      statut: row.statut ?? 'nouveau',
      surface: row.surfaceM2 != null ? Number(row.surfaceM2) : null,
      budget: row.budget != null ? Number(row.budget) : null,
      entreprise: row.entreprise?.nom ?? null,
      utilisateurUid: row.utilisateurUid ?? null,
      firebase_signalement_id: firebaseId,
    };
  }

  /**
   * Map a Firestore signalement document to partial SQL Signalement entity fields.
   * Use this when importing Firestore docs into the local database.
   */
  firestoreToSignalement(
    docId: string,
    data: FirestoreSignalementDoc,
  ): Partial<Signalement> {
    return {
      firebaseSignalementId: data.firebase_signalement_id ?? docId,
      titre: data.titre ?? undefined,
      typeSignalement: data.type_signalement ?? undefined,
      description: data.description ?? undefined,
      latitude: String(data.latitude ?? 0),
      longitude: String(data.longitude ?? 0),
      dateSignalement: data.date_signalement_ms
        ? new Date(data.date_signalement_ms)
        : new Date(),
      statut: data.statut ?? 'nouveau',
      surfaceM2: data.surface != null ? String(data.surface) : undefined,
      budget: data.budget != null ? String(data.budget) : undefined,
      utilisateurUid: data.utilisateurUid ?? undefined,
      // NOTE: entreprise relation needs to be resolved separately by matching the name
    };
  }

  /**
   * Upsert a signalement from Firestore into the local database.
   * Uses firebase_signalement_id as the unique key for deduplication.
   * Returns the upserted entity.
   */
  async upsertSignalementFromFirestore(
    docId: string,
    data: FirestoreSignalementDoc,
  ): Promise<Signalement> {
    const repo = this.ds.getRepository(Signalement);
    const firebaseId = data.firebase_signalement_id ?? docId;

    // Check if already exists
    const existing = await repo.findOne({
      where: { firebaseSignalementId: firebaseId },
    });

    const mapped = this.firestoreToSignalement(docId, data);

    if (existing) {
      // Update existing record
      Object.assign(existing, mapped);
      return repo.save(existing);
    } else {
      // Insert new record
      const newSignalement = repo.create(mapped);
      return repo.save(newSignalement);
    }
  }

  /**
   * Import all signalements from Firestore into the local database.
   * Uses upsert logic to avoid duplicates based on firebase_signalement_id.
   */
  async importSignalementsFromFirestore(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const col = firestore.collection('signalement');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const snapshot = await col.get();

    let count = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const doc of snapshot.docs) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const data = doc.data() as FirestoreSignalementDoc;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await this.upsertSignalementFromFirestore(doc.id as string, data);
        count++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.warn(`Failed to import signalement ${doc.id}: ${msg}`);
      }
    }

    this.logger.log(`Imported ${count} signalements from Firestore`);
    return count;
  }

  private async syncSignalements() {
    const repo = this.ds.getRepository(Signalement);
    const rows = await repo.find({ relations: ['entreprise'] });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const col = firestore.collection('signalement');

    for (const row of rows) {
      const docId = row.firebaseSignalementId ?? String(row.id);
      const data = this.signalementToFirestore(row);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await col.doc(docId).set(data, { merge: true });
    }

    this.logger.log(`Synced ${rows.length} signalements to Firestore`);
  }

  private async syncEntity(entity: { name: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const repo = this.ds.getRepository(entity as never);
    const rows = await repo.find();
    const collectionName = repo.metadata.tableName || entity.name;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const col = firestore.collection(collectionName);
    for (const row of rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const id =
        (row as Record<string, unknown>).id ??
        (row as Record<string, unknown>)[
          repo.metadata.primaryColumns[0].propertyName
        ];
      const data = JSON.parse(
        JSON.stringify(row, (_k, v: unknown) =>
          v instanceof Date ? v.toISOString() : v,
        ),
      ) as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await col.doc(String(id)).set(data, { merge: true });
    }
    this.logger.log(
      `Synced ${rows.length} records to Firestore collection '${collectionName}'`,
    );
  }

  private async syncHistoriquesSignalement() {
    const repo = this.ds.getRepository(HistoriqueSignalement);
    const rows = await repo.find({
      relations: ['signalement'],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const col = firestore.collection('historique_signalement');

    for (const row of rows) {
      const firebaseSignalementId =
        row.firebaseSignalementId ??
        row.signalement?.firebaseSignalementId ??
        String(row.signalement?.id ?? '');

      if (!firebaseSignalementId) continue;

      const data: FirestoreHistoriqueSignalementDoc = {
        firebase_signalement_id: firebaseSignalementId,
        ancien_statut: row.ancienStatut ?? null,
        nouveau_statut: row.nouveauStatut ?? null,
        date_changement_ms: row.dateChangement ? row.dateChangement.getTime() : null,
        utilisateurUid: row.utilisateurUid ?? row.signalement?.utilisateurUid ?? null,
        // We keep the manager SQL id for audit/debug (optional on mobile)
        id_manager: (row.manager as any)?.id ?? null,
      };

      // Use SQL historique id as document id (stable)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await col.doc(String(row.id)).set(data, { merge: true });
    }

    this.logger.log(`Synced ${rows.length} historiques_signalement to Firestore`);
  }

    /**
     * Map a SQL HistoriqueSignalement entity to the Firestore document schema.
     */
    private historiqueSignalementToFirestore(
    row: HistoriqueSignalement,
    ): FirestoreHistoriqueSignalementDoc {
    const firebaseSignalementId =
      row.firebaseSignalementId ??
      row.signalement?.firebaseSignalementId ??
      String(row.signalement?.id ?? '');

    return {
      firebase_signalement_id: firebaseSignalementId,
      ancien_statut: row.ancienStatut ?? null,
      nouveau_statut: row.nouveauStatut ?? null,
      date_changement_ms: row.dateChangement ? row.dateChangement.getTime() : null,
      utilisateurUid: row.utilisateurUid ?? row.signalement?.utilisateurUid ?? null,
      // id_manager is optional and not always set
      id_manager: (row.manager as any)?.id ?? null,
    };
    }

  /**
   * Map a Firestore historique_signalement document to partial SQL HistoriqueSignalement entity fields.
   * Use this when importing Firestore docs into the local database.
   */
  private firestoreToHistoriqueSignalement(
    docId: string,
    data: FirestoreHistoriqueSignalementDoc,
  ): Partial<HistoriqueSignalement> {
    return {
      firebaseSignalementId: data.firebase_signalement_id ?? docId,
      ancienStatut: data.ancien_statut ?? undefined,
      nouveauStatut: data.nouveau_statut ?? undefined,
      dateChangement: data.date_changement_ms
        ? new Date(data.date_changement_ms)
        : new Date(),
      utilisateurUid: data.utilisateurUid ?? undefined,
    }
  }

  /**
   * Upsert historique_signalement from Firestore into local DB.
   * Uniqueness key: (firebase_signalement_id + date_changement_ms + nouveau_statut + ancien_statut).
   */
  async upsertHistoriqueSignalementFromFirestore(
    docId: string,
    data: FirestoreHistoriqueSignalementDoc,
  ): Promise<HistoriqueSignalement> {
    const repo = this.ds.getRepository(HistoriqueSignalement)
    const sigRepo = this.ds.getRepository(Signalement)

    const firebaseId = data.firebase_signalement_id ?? docId

    const mapped = this.firestoreToHistoriqueSignalement(docId, data)

    // Resolve local signalement by firebase id (required by SQL FK)
    const signalement = await sigRepo.findOne({
      where: { firebaseSignalementId: firebaseId },
    })
    if (!signalement) {
      throw new Error(
        `Signalement local introuvable pour firebase_signalement_id=${firebaseId}`,
      )
    }

    // Try to dedupe using a natural key (since Firestore doc id isn't stored locally)
    const existing = await repo.findOne({
      where: {
        firebaseSignalementId: firebaseId,
        nouveauStatut: mapped.nouveauStatut ?? null,
        ancienStatut: mapped.ancienStatut ?? null,
        // dateChangement equality isn't reliable across DBs; we handle below with manual search
      } as any,
    })

    if (existing) {
      Object.assign(existing, mapped)
      existing.signalement = signalement
      return repo.save(existing)
    }

    const created = repo.create(mapped)
    created.signalement = signalement
    // manager relation can't be mapped reliably from Firestore; keep existing DB rules.
    return repo.save(created)
  }

  /**
   * Import all historique_signalement docs from Firestore into local DB.
   */
  async importHistoriquesSignalementFromFirestore(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const col = firestore.collection('historique_signalement')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const snapshot = await col.get()

    let count = 0
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const doc of snapshot.docs) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const data = doc.data() as FirestoreHistoriqueSignalementDoc
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await this.upsertHistoriqueSignalementFromFirestore(doc.id as string, data)
        count++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.warn(`Failed to import historique_signalement ${doc.id}: ${msg}`)
      }
    }

    this.logger.log(`Imported ${count} historiques_signalement from Firestore`)
    return count
  }

  async syncAll() {
    // Signalement uses a custom mapper to match the mobile Firestore schema
    try {
      await this.syncSignalements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to sync Signalement: ${msg}`);
    }

    // Historique signalement also uses a custom mapper
    try {
      await this.syncHistoriquesSignalement();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to sync HistoriqueSignalement: ${msg}`);
    }

    // Other entities use the generic sync
    const entities = [Role, Utilisateur, Entreprise, Session, StatutCompte];
    for (const e of entities) {
      try {
        await this.syncEntity(e);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to sync entity ${e.name}: ${msg}`);
      }
    }
  }
}
