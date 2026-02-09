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
    // Run sync in background - don't block app startup
    // This allows the backend to start even without internet
    this.syncInBackground();
  }

  private syncInBackground() {
    // Run sync asynchronously without awaiting - non-blocking
    this.syncAll()
      .then(() => this.logger.log('Initial Firestore sync completed'))
      .catch((e) => this.logger.warn('Firestore sync failed (no internet?): ' + String(e?.message ?? e)));
  }

  private async syncEntity(entity: any): Promise<{ collection: string; sent: number; skipped: number }> {
    const repo = this.ds.getRepository(entity);
    const rows = await repo.find();
    const collectionName = repo.metadata.tableName || entity.name;
    const col = firestore.collection(collectionName);
    let sent = 0;
    let skipped = 0;
    for (const row of rows) {
      const id = (row as any).id ?? (row as any)[repo.metadata.primaryColumns[0].propertyName];
      const docRef = col.doc(String(id));
      const existing = await docRef.get();
      if (existing.exists) {
        skipped++;
        continue;
      }
      const data = JSON.parse(JSON.stringify(row, (_k, v) => (v instanceof Date ? v.toISOString() : v)));
      await docRef.set(data, { merge: true });
      sent++;
    }
    this.logger.log(`Synced '${collectionName}': ${sent} envoyé(s), ${skipped} déjà existant(s) (total ${rows.length})`);
    return { collection: collectionName, sent, skipped };
  }

  async syncAll(): Promise<{ totalSent: number; totalSkipped: number; details: { collection: string; sent: number; skipped: number }[] }> {
    const entities = [Role, Utilisateur, Entreprise, Signalement, Session, StatutCompte];
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
        this.logger.warn(`Failed to sync entity ${e.name}: ${String(err?.message ?? err)}`);
      }
    }
    return { totalSent, totalSkipped, details };
  }

  /**
   * Récupère les signalements créés dans Firestore (appli mobile)
   * et les insère dans la base de données PostgreSQL locale.
   * Les docs déjà synchronisés (synced_to_pg === true) sont ignorés.
   */
  async syncSignalementsFromFirestore(): Promise<{ imported: number; skipped: number; errors: string[] }> {
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
        await col.doc(doc.id).update({ synced_to_pg: true, pg_id: existingDuplicate.id });
        skipped++;
        continue;
      }

      try {
        // Résoudre l'utilisateur : 1) par id_utilisateur, 2) par firebase UID, 3) par email stocké dans le doc Firestore
        let utilisateur: Utilisateur | null = null;

        if (data.id_utilisateur) {
          utilisateur = await utilisateurRepo.findOne({ where: { id: Number(data.id_utilisateur) } });
        }

        if (!utilisateur && data.utilisateurUid) {
          utilisateur = await utilisateurRepo.findOne({ where: { firebaseUid: data.utilisateurUid } });
        }

        // Chercher par email (le champ utilisateurEmail est stocké par l'appli mobile)
        if (!utilisateur && data.utilisateurEmail) {
          utilisateur = await utilisateurRepo.findOne({ where: { email: data.utilisateurEmail } });

          // Si trouvé par email, lier le firebase_uid pour les prochaines fois
          if (utilisateur && data.utilisateurUid && !utilisateur.firebaseUid) {
            utilisateur.firebaseUid = data.utilisateurUid;
            await utilisateurRepo.save(utilisateur);
            this.logger.log(`Linked firebase UID ${data.utilisateurUid} to PG user ${utilisateur.id} (${data.utilisateurEmail})`);
          }
        }

        // Dernier recours : auto-créer l'utilisateur PG à partir des infos du doc Firestore
        if (!utilisateur && data.utilisateurEmail) {
          const roleRepo = this.ds.getRepository(Role);
          const defaultRole = await roleRepo.findOne({ where: { nom: 'citoyen' } });

          const newUser = utilisateurRepo.create({
            email: data.utilisateurEmail,
            motDePasse: '!!firebase_only!!',
            firebaseUid: data.utilisateurUid || null,
            role: defaultRole || undefined,
          });
          utilisateur = await utilisateurRepo.save(newUser);
          this.logger.log(`Auto-created PG user ${utilisateur.id} for ${data.utilisateurEmail} (uid=${data.utilisateurUid})`);
        }

        // Si toujours pas trouvé et qu'on a un UID, chercher l'email dans la collection email_uid de Firestore
        if (!utilisateur && data.utilisateurUid) {
          try {
            const emailUidCol = firestore.collection('email_uid');
            const emailSnap = await emailUidCol.where('uid', '==', data.utilisateurUid).limit(1).get();
            if (!emailSnap.empty) {
              const emailDoc = emailSnap.docs[0].data();
              const resolvedEmail = emailDoc?.email;
              if (resolvedEmail) {
                // Chercher l'utilisateur par cet email
                utilisateur = await utilisateurRepo.findOne({ where: { email: resolvedEmail } });

                if (utilisateur && !utilisateur.firebaseUid) {
                  utilisateur.firebaseUid = data.utilisateurUid;
                  await utilisateurRepo.save(utilisateur);
                  this.logger.log(`Linked firebase UID ${data.utilisateurUid} to PG user ${utilisateur.id} via email_uid (${resolvedEmail})`);
                }

                // Si toujours pas trouvé : auto-créer
                if (!utilisateur) {
                  const roleRepo = this.ds.getRepository(Role);
                  const defaultRole = await roleRepo.findOne({ where: { nom: 'citoyen' } });

                  const newUser = utilisateurRepo.create({
                    email: resolvedEmail,
                    motDePasse: '!!firebase_only!!',
                    firebaseUid: data.utilisateurUid,
                    role: defaultRole || undefined,
                  });
                  utilisateur = await utilisateurRepo.save(newUser);
                  this.logger.log(`Auto-created PG user ${utilisateur.id} via email_uid for ${resolvedEmail} (uid=${data.utilisateurUid})`);
                }
              }
            }
          } catch (emailUidErr) {
            this.logger.warn(`email_uid lookup failed for UID ${data.utilisateurUid}: ${String(emailUidErr?.message ?? emailUidErr)}`);
          }
        }

        if (!utilisateur) {
          errors.push(`Doc ${doc.id}: utilisateur introuvable (id=${data.id_utilisateur}, uid=${data.utilisateurUid}, email=${data.utilisateurEmail})`);
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
          surfaceM2: data.surface_m2 != null ? String(data.surface_m2) : undefined,
          budget: data.budget != null ? String(data.budget) : undefined,
          avancement: statut === 'resolu' ? 100 : statut === 'en_cours' ? 50 : 0,
          dateSignalement,
          utilisateur,
        });

        const saved = await signalementRepo.save(entity);

        // Marquer le doc Firestore comme synchronisé (évite les doublons)
        await col.doc(doc.id).update({ synced_to_pg: true, pg_id: saved.id });

        imported++;
        this.logger.log(`Imported Firestore signalement ${doc.id} → PG id ${saved.id}`);
      } catch (err) {
        errors.push(`Doc ${doc.id}: ${String(err?.message ?? err)}`);
      }
    }

    this.logger.log(`syncSignalementsFromFirestore: imported=${imported}, skipped=${skipped}, errors=${errors.length}`);
    return { imported, skipped, errors };
  }
}
