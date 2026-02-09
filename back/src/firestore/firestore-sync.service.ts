import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { firestore } from '../firebase-admin';
import { Role } from '../roles/role.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Session } from '../sessions/session.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';
import { FirestoreDiffSyncService } from './firestore-diff-sync.service';

@Injectable()
export class FirestoreSyncService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreSyncService.name);
  constructor(
    private readonly ds: DataSource,
    private readonly diffSync: FirestoreDiffSyncService,
  ) {}

  async onModuleInit() {
    // Run sync in background - don't block app startup
    // This allows the backend to start even without internet
    this.syncInBackground();
  }

  private syncInBackground() {
    // Run sync asynchronously without awaiting - non-blocking
    this.syncAll()
      .then(() => this.logger.log('Initial Firestore sync completed'))
      .catch((e) =>
        this.logger.warn(
          'Firestore sync failed (no internet?): ' + String(e?.message ?? e),
        ),
      );
  }

  private async syncEntity(
    entity: any,
  ): Promise<{ collection: string; sent: number; skipped: number }> {
    const repo = this.ds.getRepository(entity);
    const rows = await repo.find();
    const collectionName = repo.metadata.tableName || entity.name;
    const col = firestore.collection(collectionName);
    let sent = 0;
    let skipped = 0;
    for (const row of rows) {
      const id =
        (row as any).id ??
        (row as any)[repo.metadata.primaryColumns[0].propertyName];
      const docRef = col.doc(String(id));
      const existing = await docRef.get();
      if (existing.exists) {
        skipped++;
        continue;
      }
      const data = JSON.parse(
        JSON.stringify(row, (_k, v) =>
          v instanceof Date ? v.toISOString() : v,
        ),
      );
      await docRef.set(data, { merge: true });
      sent++;
    }
    this.logger.log(
      `Synced '${collectionName}': ${sent} envoyé(s), ${skipped} déjà existant(s) (total ${rows.length})`,
    );
    return { collection: collectionName, sent, skipped };
  }

  async syncAll(): Promise<{
    totalSent: number;
    totalSkipped: number;
    details: { collection: string; sent: number; skipped: number }[];
  }> {
    const entities = [
      Role,
      Utilisateur,
      Entreprise,
      Signalement,
      Session,
      StatutCompte,
    ];
    const details: { collection: string; sent: number; skipped: number }[] = [];
    let totalSent = 0;
    let totalSkipped = 0;
    for (const e of entities) {
      try {
        const result = await this.syncEntity(e);
        details.push(result);
        totalSent += result.sent;
        totalSkipped += result.skipped;
      } catch (err) {
        this.logger.warn(
          `Failed to sync entity ${e.name}: ${String(err?.message ?? err)}`,
        );
      }
    }
    return { totalSent, totalSkipped, details };
  }

  /**
   * Récupère les signalements créés dans Firestore (appli mobile)
   * et les insère dans la base de données PostgreSQL locale.
   * Les docs déjà synchronisés (synced_to_pg === true) sont ignorés.
   */
  async syncSignalementsFromFirestore(): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const col = firestore.collection('signalement');
    const snapshot = await col.get();

    const signalementRepo = this.ds.getRepository(Signalement);
    const utilisateurRepo = this.ds.getRepository(Utilisateur);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Ignorer les docs poussés depuis PG (ID numérique = vient de syncAll)
      if (/^\d+$/.test(doc.id)) {
        skipped++;
        continue;
      }

      // Vérifier si ce signalement existe déjà en base (coordonnées exactes + même utilisateur)
      const existingDuplicate = await signalementRepo.findOne({
        where: {
          latitude: String(data.latitude),
          longitude: String(data.longitude),
        },
      });
      if (existingDuplicate) {
        // Mettre à jour le pg_id dans Firestore pour cohérence
        await col
          .doc(doc.id)
          .update({ synced_to_pg: true, pg_id: existingDuplicate.id });

        // Keep a canonical mapping to the mobile Firestore doc id on the PG row
        try {
          (existingDuplicate as any).firestoreDocId = doc.id;
          await signalementRepo.save(existingDuplicate);
        } catch (mapErr) {
          this.logger.warn(
            `Failed to persist firestoreDocId mapping for PG ${existingDuplicate.id}: ${String(mapErr)}`,
          );
        }

        skipped++;
        continue;
      }

      try {
        // Résoudre l'utilisateur : 1) par id_utilisateur, 2) par firebase UID, 3) par email stocké dans le doc Firestore
        let utilisateur: Utilisateur | null = null;

        if (data.id_utilisateur) {
          utilisateur = await utilisateurRepo.findOne({
            where: { id: Number(data.id_utilisateur) },
          });
        }

        if (!utilisateur && data.utilisateurUid) {
          utilisateur = await utilisateurRepo.findOne({
            where: { firebaseUid: data.utilisateurUid },
          });
        }

        // Chercher par email (le champ utilisateurEmail est stocké par l'appli mobile)
        if (!utilisateur && data.utilisateurEmail) {
          utilisateur = await utilisateurRepo.findOne({
            where: { email: data.utilisateurEmail },
          });

          // Si trouvé par email, lier le firebase_uid pour les prochaines fois
          if (utilisateur && data.utilisateurUid && !utilisateur.firebaseUid) {
            utilisateur.firebaseUid = data.utilisateurUid;
            await utilisateurRepo.save(utilisateur);
            this.logger.log(
              `Linked firebase UID ${data.utilisateurUid} to PG user ${utilisateur.id} (${data.utilisateurEmail})`,
            );
          }
        }

        // Dernier recours : auto-créer l'utilisateur PG à partir des infos du doc Firestore
        if (!utilisateur && data.utilisateurEmail) {
          const roleRepo = this.ds.getRepository(Role);
          const defaultRole = await roleRepo.findOne({
            where: { nom: 'citoyen' },
          });

          const newUser = utilisateurRepo.create({
            email: data.utilisateurEmail,
            motDePasse: '!!firebase_only!!',
            firebaseUid: data.utilisateurUid || null,
            role: defaultRole || undefined,
          });
          utilisateur = await utilisateurRepo.save(newUser);
          this.logger.log(
            `Auto-created PG user ${utilisateur.id} for ${data.utilisateurEmail} (uid=${data.utilisateurUid})`,
          );
        }

        // Si toujours pas trouvé et qu'on a un UID, chercher l'email dans la collection email_uid de Firestore
        if (!utilisateur && data.utilisateurUid) {
          try {
            const emailUidCol = firestore.collection('email_uid');
            const emailSnap = await emailUidCol
              .where('uid', '==', data.utilisateurUid)
              .limit(1)
              .get();
            if (!emailSnap.empty) {
              const emailDoc = emailSnap.docs[0].data();
              const resolvedEmail = emailDoc?.email;
              if (resolvedEmail) {
                // Chercher l'utilisateur par cet email
                utilisateur = await utilisateurRepo.findOne({
                  where: { email: resolvedEmail },
                });

                if (utilisateur && !utilisateur.firebaseUid) {
                  utilisateur.firebaseUid = data.utilisateurUid;
                  await utilisateurRepo.save(utilisateur);
                  this.logger.log(
                    `Linked firebase UID ${data.utilisateurUid} to PG user ${utilisateur.id} via email_uid (${resolvedEmail})`,
                  );
                }

                // Si toujours pas trouvé : auto-créer
                if (!utilisateur) {
                  const roleRepo = this.ds.getRepository(Role);
                  const defaultRole = await roleRepo.findOne({
                    where: { nom: 'citoyen' },
                  });

                  const newUser = utilisateurRepo.create({
                    email: resolvedEmail,
                    motDePasse: '!!firebase_only!!',
                    firebaseUid: data.utilisateurUid,
                    role: defaultRole || undefined,
                  });
                  utilisateur = await utilisateurRepo.save(newUser);
                  this.logger.log(
                    `Auto-created PG user ${utilisateur.id} via email_uid for ${resolvedEmail} (uid=${data.utilisateurUid})`,
                  );
                }
              }
            }
          } catch (emailUidErr) {
            this.logger.warn(
              `email_uid lookup failed for UID ${data.utilisateurUid}: ${String(emailUidErr?.message ?? emailUidErr)}`,
            );
          }
        }

        if (!utilisateur) {
          errors.push(
            `Doc ${doc.id}: utilisateur introuvable (id=${data.id_utilisateur}, uid=${data.utilisateurUid}, email=${data.utilisateurEmail})`,
          );
          continue;
        }

        // Mapper le statut Firestore vers le statut PG
        const statutMap: Record<string, string> = {
          nouveau: 'actif',
          actif: 'actif',
          en_cours: 'en_cours',
          resolu: 'resolu',
          rejete: 'rejete',
        };
        const statut = statutMap[data.statut] || 'actif';

        // Convertir date_signalement (Firestore Timestamp → Date)
        let dateSignalement = new Date();
        if (data.date_signalement) {
          if (typeof data.date_signalement.toDate === 'function') {
            dateSignalement = data.date_signalement.toDate();
          } else if (typeof data.date_signalement === 'number') {
            dateSignalement = new Date(data.date_signalement);
          }
        }

        const entity = signalementRepo.create({
          titre: data.titre || 'Signalement mobile',
          description: data.description || null,
          latitude: String(data.latitude),
          longitude: String(data.longitude),
          statut,
          priorite: 1,
          surfaceM2:
            data.surface_m2 != null ? String(data.surface_m2) : undefined,
          budget: data.budget != null ? String(data.budget) : undefined,
          avancement:
            statut === 'resolu' ? 100 : statut === 'en_cours' ? 50 : 0,
          dateSignalement,
          utilisateur,
        });

        const saved = await signalementRepo.save(entity);

        // Marquer le doc Firestore comme synchronisé (évite les doublons)
        await col.doc(doc.id).update({ synced_to_pg: true, pg_id: saved.id });

        // Persist mapping PG -> Firestore doc id
        try {
          (saved as any).firestoreDocId = doc.id;
          await signalementRepo.save(saved);
        } catch (mapErr) {
          this.logger.warn(
            `Failed to persist firestoreDocId mapping for imported PG ${saved.id}: ${String(mapErr)}`,
          );
        }

        // Also immediately mirror current PG status to the original mobile-created doc
        // and ensure the pg mirror doc exists.
        try {
          await col.doc(doc.id).set(
            {
              statut: saved.statut,
              avancement: saved.avancement,
              updated_from: 'pg',
            },
            { merge: true },
          );
          await this.diffSync.ensurePgSignalementMirror(saved.id);
        } catch (mirrorErr) {
          this.logger.warn(
            `Firestore mirror update failed for imported doc ${doc.id}: ${String(mirrorErr?.message ?? mirrorErr)}`,
          );
        }

        imported++;
        this.logger.log(
          `Imported Firestore signalement ${doc.id} → PG id ${saved.id}`,
        );
      } catch (err) {
        errors.push(`Doc ${doc.id}: ${String(err?.message ?? err)}`);
      }
    }

    this.logger.log(
      `syncSignalementsFromFirestore: imported=${imported}, skipped=${skipped}, errors=${errors.length}`,
    );
    return { imported, skipped, errors };
  }

  /**
   * Push une entité PG → Firebase avec merge (crée + met à jour).
   * Contrairement à syncEntity qui skip les existants, cette méthode écrase.
   */
  private async pushEntityFull(entity: any): Promise<{ collection: string; created: number; updated: number }> {
    const repo = this.ds.getRepository(entity);
    const rows = await repo.find({ relations: repo.metadata.relations.map((r) => r.propertyName) });
    const collectionName = repo.metadata.tableName || entity.name;
    const col = firestore.collection(collectionName);
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      const id = (row as any).id ?? (row as any)[repo.metadata.primaryColumns[0].propertyName];
      const docRef = col.doc(String(id));
      const data = JSON.parse(JSON.stringify(row, (_k, v) => (v instanceof Date ? v.toISOString() : v)));
      const existing = await docRef.get();
      await docRef.set(data, { merge: true });
      if (existing.exists) { updated++; } else { created++; }
    }
    this.logger.log(`FullPush '${collectionName}': ${created} créé(s), ${updated} mis à jour (total ${rows.length})`);
    return { collection: collectionName, created, updated };
  }

  /**
   * Pull générique Firebase → PG pour une entité simple (sans FK complexes).
   * Compare par ID et insère les docs Firestore manquants en BDD.
   */
  private async pullEntityFromFirestore(entity: any): Promise<{ collection: string; imported: number; skipped: number }> {
    const repo = this.ds.getRepository(entity);
    const collectionName = repo.metadata.tableName || entity.name;
    const col = firestore.collection(collectionName);
    const snapshot = await col.get();
    let imported = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      // Ignorer les docs système (bootstrap)
      const data = doc.data();
      if (data.__system) { skipped++; continue; }

      // Si le doc a un ID numérique, vérifier s'il existe en base
      const numId = Number(doc.id);
      if (!isNaN(numId) && numId > 0) {
        const exists = await repo.findOne({ where: { id: numId } });
        if (exists) { skipped++; continue; }
      }

      // Ne pas importer les docs non-numériques pour les tables PG (sauf signalements traités ailleurs)
      if (isNaN(numId)) { skipped++; continue; }

      try {
        // Créer un objet simple sans les FK (on garde les colonnes simples)
        const columns = repo.metadata.columns.map((c) => c.propertyName);
        const simpleData: any = {};
        for (const colName of columns) {
          if (data[colName] !== undefined) {
            simpleData[colName] = data[colName];
          }
        }
        // Retirer l'ID auto-généré pour laisser PG l'attribuer
        delete simpleData.id;

        const created = repo.create(simpleData);
        await repo.save(created);
        imported++;
      } catch {
        skipped++; // Ignorer les erreurs (contraintes FK, etc.)
      }
    }

    this.logger.log(`FullPull '${collectionName}': ${imported} importé(s), ${skipped} ignoré(s)`);
    return { collection: collectionName, imported, skipped };
  }

  /**
   * Synchronisation bidirectionnelle complète :
   * 1) PG → Firebase (toutes les tables, avec merge = crée + met à jour)
   * 2) Firebase → PG (signalements mobiles + entités simples manquantes)
   */
  async fullBidirectionalSync(): Promise<{
    push: { totalCreated: number; totalUpdated: number; details: any[] };
    pull: { totalImported: number; totalSkipped: number; details: any[]; errors: string[] };
  }> {
    // === PUSH : PG → Firebase (toutes les tables) ===
    const allEntities = [
      Role, Utilisateur, Entreprise, TypeProbleme, Signalement,
      HistoriqueSignalement, HistoriqueStatusUtilisateur,
      Session, StatutCompte, Validation, JournalAcces,
      TentativeConnexion, Synchronisation,
    ];

    const pushDetails: any[] = [];
    let totalCreated = 0;
    let totalUpdated = 0;

    for (const e of allEntities) {
      try {
        const result = await this.pushEntityFull(e);
        pushDetails.push(result);
        totalCreated += result.created;
        totalUpdated += result.updated;
      } catch (err) {
        this.logger.warn(`FullPush failed for ${e.name}: ${String(err?.message ?? err)}`);
        pushDetails.push({ collection: e.name, created: 0, updated: 0, error: String(err?.message ?? err) });
      }
    }

    // === PULL : Firebase → PG ===
    // 1) Signalements (logique spéciale avec résolution d'utilisateur)
    const signalementPull = await this.syncSignalementsFromFirestore();

    // 2) Autres collections simples
    const pullEntities = [
      Role, Utilisateur, Entreprise, TypeProbleme,
      HistoriqueSignalement, StatutCompte, Session,
    ];

    const pullDetails: any[] = [
      { collection: 'signalement', imported: signalementPull.imported, skipped: signalementPull.skipped },
    ];
    let totalImported = signalementPull.imported;
    let totalSkipped = signalementPull.skipped;

    for (const e of pullEntities) {
      try {
        const result = await this.pullEntityFromFirestore(e);
        pullDetails.push(result);
        totalImported += result.imported;
        totalSkipped += result.skipped;
      } catch (err) {
        this.logger.warn(`FullPull failed for ${e.name}: ${String(err?.message ?? err)}`);
      }
    }

    this.logger.log(`FullSync terminé — Push: ${totalCreated} créé(s), ${totalUpdated} mis à jour | Pull: ${totalImported} importé(s), ${totalSkipped} ignoré(s)`);

    return {
      push: { totalCreated, totalUpdated, details: pushDetails },
      pull: { totalImported, totalSkipped, details: pullDetails, errors: signalementPull.errors },
    };
  }
}
