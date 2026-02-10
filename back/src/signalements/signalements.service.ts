import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Signalement,
  StatutSignalement,
  avancementFromStatut,
} from './signalement.entity';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { UpdateSignalementDto } from './dto/update-signalement.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { TypeProbleme } from '../problemes/type-probleme.entity';
import { JournalService } from '../journal/journal.service';
import { HistoriqueSignalementService } from '../historique_signalement/historique-signalement.service';
import { FirestoreDiffSyncService } from '../firestore/firestore-diff-sync.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SignalementsService {
  constructor(
    @InjectRepository(Signalement) private repo: Repository<Signalement>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
    @InjectRepository(Entreprise) private entRepo: Repository<Entreprise>,
    @InjectRepository(TypeProbleme) private typeRepo: Repository<TypeProbleme>,
    private readonly journalService: JournalService,
    private readonly historiqueService: HistoriqueSignalementService,
    private readonly firestoreDiffSync: FirestoreDiffSyncService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async logAction(
    action: string,
    ressource: string,
    utilisateurId?: number,
    niveau: string = 'info',
    details?: string,
  ) {
    try {
      await this.journalService.create({
        action,
        ressource,
        utilisateurId,
        niveau,
        details,
      });
    } catch (e) {
      console.error('Failed to log action:', e);
    }
  }

  async create(dto: CreateSignalementDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.utilisateurId },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let typeProbleme: TypeProbleme | undefined;
    if (dto.typeProblemeId) {
      const type = await this.typeRepo.findOne({
        where: { id: dto.typeProblemeId },
      });
      if (!type) throw new NotFoundException('Type de problème non trouvé');
      if (!type.actif)
        throw new BadRequestException("Ce type de problème n'est plus actif");
      typeProbleme = type;
    }

    let entreprise: Entreprise | undefined;
    if (dto.entrepriseId) {
      const ent = await this.entRepo.findOne({
        where: { id: dto.entrepriseId },
      });
      if (!ent) throw new NotFoundException('Entreprise non trouvée');
      entreprise = ent;
    }

    const statut = dto.statut ?? StatutSignalement.ACTIF;
    const entity = this.repo.create({
      titre: dto.titre,
      description: dto.description,
      latitude: String(dto.latitude),
      longitude: String(dto.longitude),
      adresse: dto.adresse,
      statut,
      priorite: dto.priorite ?? 1,
      photoUrl: dto.photoUrl,
      surfaceM2:
        dto.surfaceM2 !== undefined ? String(dto.surfaceM2) : undefined,
      budget: dto.budget !== undefined ? String(dto.budget) : undefined,
      avancement: avancementFromStatut(statut),
      utilisateur: user,
      typeProbleme,
      entreprise,
    });
    const saved = await this.repo.save(entity);

    // Log creation
    await this.logAction(
      'CREATE_SIGNALEMENT',
      'signalements',
      dto.utilisateurId,
      'info',
      `Nouveau signalement créé: ${dto.titre} (ID: ${saved.id})`,
    );

    return saved;
  }

  findAll() {
    return this.repo.find({
      relations: [
        'utilisateur',
        'entreprise',
        'typeProbleme',
        'utilisateurResolution',
      ],
      order: { dateSignalement: 'DESC' },
    });
  }

  findAllActifs() {
    return this.repo.find({
      where: { statut: StatutSignalement.ACTIF },
      relations: ['utilisateur', 'typeProbleme'],
      order: { priorite: 'DESC', dateSignalement: 'DESC' },
    });
  }

  findByStatut(statut: string) {
    return this.repo.find({
      where: { statut },
      relations: ['utilisateur', 'typeProbleme', 'utilisateurResolution'],
      order: { dateSignalement: 'DESC' },
    });
  }

  findByType(typeId: number) {
    return this.repo.find({
      where: { typeProbleme: { id: typeId } },
      relations: ['utilisateur', 'typeProbleme'],
      order: { dateSignalement: 'DESC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: [
        'utilisateur',
        'entreprise',
        'typeProbleme',
        'utilisateurResolution',
      ],
    });
    if (!item) throw new NotFoundException('Signalement non trouvé');
    return item;
  }

  /** Met à jour uniquement la photo (requête légère, pas de chargement de relations) */
  async updatePhoto(id: number, photoUrl: string) {
    const result = await this.repo.update(id, { photoUrl });
    if (result.affected === 0)
      throw new NotFoundException('Signalement non trouvé');
    return { photoUrl };
  }

  async update(id: number, dto: UpdateSignalementDto) {
    const entity = await this.findOne(id);

    if (dto.titre !== undefined) entity.titre = dto.titre;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.latitude !== undefined) entity.latitude = String(dto.latitude);
    if (dto.longitude !== undefined) entity.longitude = String(dto.longitude);
    if (dto.adresse !== undefined) entity.adresse = dto.adresse;
    if (dto.priorite !== undefined) entity.priorite = dto.priorite;
    if (dto.photoUrl !== undefined) entity.photoUrl = dto.photoUrl;
    if (dto.commentaireResolution !== undefined)
      entity.commentaireResolution = dto.commentaireResolution;
    if (dto.surfaceM2 !== undefined)
      entity.surfaceM2 =
        dto.surfaceM2 != null ? String(dto.surfaceM2) : undefined;
    if (dto.budget !== undefined)
      entity.budget = dto.budget != null ? String(dto.budget) : undefined;

    let createdHistoriqueId: number | undefined;

    if (dto.statut !== undefined && dto.statut !== entity.statut) {
      const ancienStatut = entity.statut;
      entity.statut = dto.statut;
      entity.avancement = avancementFromStatut(dto.statut);
      if (String(dto.statut) === String(StatutSignalement.RESOLU)) {
        entity.dateResolution = new Date();
      }
      // Enregistrer l'historique du changement de statut
      const managerId = dto.utilisateurId || entity.utilisateur?.id;
      if (managerId) {
        try {
          const hist = await this.historiqueService.create({
            ancienStatut,
            nouveauStatut: dto.statut,
            signalementId: id,
            managerId,
          });
          createdHistoriqueId = hist.id;
        } catch (e) {
          console.error('Erreur enregistrement historique:', e);
        }
      }
    }

    const saved = await this.repo.save(entity);

    // If we changed status, push pending diffs to Firestore (no Firestore reads)
    if (dto.statut !== undefined) {
      try {
        await this.firestoreDiffSync.flushPendingStatusDiffs(25);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Don't fail the API request if Firestore is unreachable
        console.warn('Firestore diff sync failed:', msg);
      }

      // Notifications (best-effort): create local outbox row, then try immediate delivery
      if (createdHistoriqueId && saved.utilisateur?.id) {
        try {
          // Recipient must be the signalement creator (owner), not the manager who performed the update.
          const utilisateur = await this.userRepo.findOne({
            where: { id: saved.utilisateur.id },
          });
          if (utilisateur) {
            const hist = await this.historiqueService.findOne(createdHistoriqueId);
            const outbox = await this.notificationsService.enqueueSignalementStatusChange({
              historique: hist,
              signalement: saved,
              utilisateur,
            });
            await this.notificationsService.tryDeliverNow(outbox.id);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('Notification enqueue/delivery failed:', msg);
        }
      }
    }

    // Log update
    await this.logAction(
      'UPDATE_SIGNALEMENT',
      'signalements',
      dto.utilisateurId || entity.utilisateur?.id,
      'info',
      `Signalement modifié: ${entity.titre} (ID: ${id})`,
    );

    return saved;
  }

  async resoudre(
    id: number,
    utilisateurResolutionId: number,
    commentaire?: string,
  ) {
    const entity = await this.findOne(id);
    const user = await this.userRepo.findOne({
      where: { id: utilisateurResolutionId },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const ancienStatut = entity.statut;
    entity.statut = StatutSignalement.RESOLU;
    entity.avancement = 100;
    entity.dateResolution = new Date();
    entity.utilisateurResolution = user;
    if (commentaire) entity.commentaireResolution = commentaire;

    const saved = await this.repo.save(entity);

    let createdHistoriqueId: number | undefined;

    // Enregistrer l'historique
    try {
      const hist = await this.historiqueService.create({
        ancienStatut,
        nouveauStatut: StatutSignalement.RESOLU,
        signalementId: id,
        managerId: utilisateurResolutionId,
      });
      createdHistoriqueId = hist.id;
    } catch (e) {
      console.error('Erreur enregistrement historique:', e);
    }

    // Push pending diffs to Firestore
    try {
      await this.firestoreDiffSync.flushPendingStatusDiffs(25);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('Firestore diff sync failed:', msg);
    }

    // Notifications (best-effort)
    if (createdHistoriqueId && saved.utilisateur?.id) {
      try {
        // Recipient must be the signalement creator (owner), not the manager who performed the update.
        const utilisateur = await this.userRepo.findOne({
          where: { id: saved.utilisateur.id },
        });
        if (utilisateur) {
          const hist = await this.historiqueService.findOne(createdHistoriqueId);
          const outbox = await this.notificationsService.enqueueSignalementStatusChange({
            historique: hist,
            signalement: saved,
            utilisateur,
          });
          await this.notificationsService.tryDeliverNow(outbox.id);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Notification enqueue/delivery failed:', msg);
      }
    }

    // Log resolution
    await this.logAction(
      'RESOLVE_SIGNALEMENT',
      'signalements',
      utilisateurResolutionId,
      'info',
      `Signalement résolu: ${entity.titre} (ID: ${id})`,
    );

    return saved;
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    // Log deletion
    await this.logAction(
      'DELETE_SIGNALEMENT',
      'signalements',
      item.utilisateur?.id,
      'warning',
      `Signalement supprimé: ${item.titre} (ID: ${id})`,
    );

    await this.repo.remove(item);
  }

  // GeoJSON pour la carte
  formatGeoJSON(signalements: Signalement[]) {
    return {
      type: 'FeatureCollection',
      features: signalements.map((s) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(s.longitude), parseFloat(s.latitude)],
        },
        properties: {
          id: s.id,
          titre: s.titre,
          description: s.description,
          statut: s.statut,
          avancement: s.avancement,
          priorite: s.priorite,
          dateSignalement: s.dateSignalement,
          typeProbleme: s.typeProbleme
            ? {
                id: s.typeProbleme.id,
                nom: s.typeProbleme.nom,
                icone: s.typeProbleme.icone,
                couleur: s.typeProbleme.couleur,
              }
            : null,
          adresse: s.adresse,
          photoUrl: s.photoUrl,
        },
      })),
    };
  }

  async getGeoJSON(statut?: string) {
    const signalements = statut
      ? await this.findByStatut(statut)
      : await this.findAll();
    return this.formatGeoJSON(signalements);
  }

  // Statistiques
  async getStatistiques() {
    const total = await this.repo.count();
    const actifs = await this.repo.count({
      where: { statut: StatutSignalement.ACTIF },
    });
    const enCours = await this.repo.count({
      where: { statut: StatutSignalement.EN_COURS },
    });
    const resolus = await this.repo.count({
      where: { statut: StatutSignalement.RESOLU },
    });
    const rejetes = await this.repo.count({
      where: { statut: StatutSignalement.REJETE },
    });

    const parType = await this.repo
      .createQueryBuilder('s')
      .leftJoin('s.typeProbleme', 't')
      .select('t.nom', 'type')
      .addSelect('t.couleur', 'couleur')
      .addSelect('COUNT(s.id)', 'count')
      .groupBy('t.id')
      .addGroupBy('t.nom')
      .addGroupBy('t.couleur')
      .getRawMany();

    // --- Délais de traitement ---
    // 1) Délai moyen de résolution : dateResolution - dateSignalement pour les résolus
    const delaiResolutionRaw = await this.repo
      .createQueryBuilder('s')
      .select(
        'AVG(EXTRACT(EPOCH FROM (s.date_resolution - s.date_signalement)) / 86400)',
        'moyenJours',
      )
      .addSelect(
        'MIN(EXTRACT(EPOCH FROM (s.date_resolution - s.date_signalement)) / 86400)',
        'minJours',
      )
      .addSelect(
        'MAX(EXTRACT(EPOCH FROM (s.date_resolution - s.date_signalement)) / 86400)',
        'maxJours',
      )
      .addSelect('COUNT(s.id_signalement)', 'nombre')
      .where('s.statut = :statut', { statut: StatutSignalement.RESOLU })
      .andWhere('s.date_resolution IS NOT NULL')
      .getRawOne();

    // 2) Délai moyen de prise en charge : premier passage actif → en_cours via historique
    const delaiPriseEnChargeRaw = await this.repo
      .createQueryBuilder('s')
      .innerJoin(
        'historique_signalement',
        'h',
        'h.id_signalement = s.id_signalement AND h.nouveau_statut = :enCours',
        { enCours: StatutSignalement.EN_COURS },
      )
      .select(
        'AVG(EXTRACT(EPOCH FROM (h.date_changement - s.date_signalement)) / 86400)',
        'moyenJours',
      )
      .addSelect(
        'MIN(EXTRACT(EPOCH FROM (h.date_changement - s.date_signalement)) / 86400)',
        'minJours',
      )
      .addSelect(
        'MAX(EXTRACT(EPOCH FROM (h.date_changement - s.date_signalement)) / 86400)',
        'maxJours',
      )
      .addSelect('COUNT(DISTINCT s.id_signalement)', 'nombre')
      .getRawOne();

    // 3) Délai moyen en_cours → résolu via historique
    const delaiTraitementRaw = await this.repo
      .createQueryBuilder('s')
      .innerJoin(
        'historique_signalement',
        'h_ec',
        'h_ec.id_signalement = s.id_signalement AND h_ec.nouveau_statut = :enCours',
        { enCours: StatutSignalement.EN_COURS },
      )
      .innerJoin(
        'historique_signalement',
        'h_res',
        'h_res.id_signalement = s.id_signalement AND h_res.nouveau_statut = :resolu',
        { resolu: StatutSignalement.RESOLU },
      )
      .select(
        'AVG(EXTRACT(EPOCH FROM (h_res.date_changement - h_ec.date_changement)) / 86400)',
        'moyenJours',
      )
      .addSelect(
        'MIN(EXTRACT(EPOCH FROM (h_res.date_changement - h_ec.date_changement)) / 86400)',
        'minJours',
      )
      .addSelect(
        'MAX(EXTRACT(EPOCH FROM (h_res.date_changement - h_ec.date_changement)) / 86400)',
        'maxJours',
      )
      .addSelect('COUNT(DISTINCT s.id_signalement)', 'nombre')
      .getRawOne();

    const parseDelai = (raw: any) => ({
      moyenJours: raw?.moyenJours
        ? parseFloat(parseFloat(raw.moyenJours).toFixed(1))
        : null,
      minJours: raw?.minJours
        ? parseFloat(parseFloat(raw.minJours).toFixed(1))
        : null,
      maxJours: raw?.maxJours
        ? parseFloat(parseFloat(raw.maxJours).toFixed(1))
        : null,
      nombre: raw?.nombre ? parseInt(raw.nombre, 10) : 0,
    });

    const tauxResolution =
      total > 0 ? parseFloat(((resolus / total) * 100).toFixed(1)) : 0;

    return {
      total,
      parStatut: { actifs, enCours, resolus, rejetes },
      parType,
      delais: {
        resolution: parseDelai(delaiResolutionRaw),
        priseEnCharge: parseDelai(delaiPriseEnChargeRaw),
        traitement: parseDelai(delaiTraitementRaw),
      },
      tauxResolution,
    };
  }
}
