import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signalement, StatutSignalement } from './signalement.entity';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { UpdateSignalementDto } from './dto/update-signalement.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { TypeProbleme } from '../problemes/type-probleme.entity';

@Injectable()
export class SignalementsService {
  constructor(
    @InjectRepository(Signalement) private repo: Repository<Signalement>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
    @InjectRepository(Entreprise) private entRepo: Repository<Entreprise>,
    @InjectRepository(TypeProbleme) private typeRepo: Repository<TypeProbleme>,
  ) {}

  async create(dto: CreateSignalementDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let typeProbleme: TypeProbleme | undefined;
    if (dto.typeProblemeId) {
      const type = await this.typeRepo.findOne({ where: { id: dto.typeProblemeId } });
      if (!type) throw new NotFoundException('Type de problème non trouvé');
      if (!type.actif) throw new BadRequestException('Ce type de problème n\'est plus actif');
      typeProbleme = type;
    }

    let entreprise: Entreprise | undefined;
    if (dto.entrepriseId) {
      const ent = await this.entRepo.findOne({ where: { id: dto.entrepriseId } });
      if (!ent) throw new NotFoundException('Entreprise non trouvée');
      entreprise = ent;
    }

    const entity = this.repo.create({
      titre: dto.titre,
      description: dto.description,
      latitude: String(dto.latitude),
      longitude: String(dto.longitude),
      adresse: dto.adresse,
      statut: dto.statut ?? StatutSignalement.ACTIF,
      priorite: dto.priorite ?? 1,
      photoUrl: dto.photoUrl,
      surfaceM2: dto.surfaceM2 !== undefined ? String(dto.surfaceM2) : undefined,
      budget: dto.budget !== undefined ? String(dto.budget) : undefined,
      utilisateur: user,
      typeProbleme,
      entreprise,
    });
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({
      relations: ['utilisateur', 'entreprise', 'typeProbleme', 'utilisateurResolution'],
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
      relations: ['utilisateur', 'entreprise', 'typeProbleme', 'utilisateurResolution'],
    });
    if (!item) throw new NotFoundException('Signalement non trouvé');
    return item;
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
    if (dto.commentaireResolution !== undefined) entity.commentaireResolution = dto.commentaireResolution;
    if (dto.surfaceM2 !== undefined) entity.surfaceM2 = String(dto.surfaceM2);
    if (dto.budget !== undefined) entity.budget = String(dto.budget);

    if (dto.statut !== undefined) {
      entity.statut = dto.statut;
      if (dto.statut === StatutSignalement.RESOLU) {
        entity.dateResolution = new Date();
      }
    }

    if (dto.typeProblemeId !== undefined) {
      if (dto.typeProblemeId === null) {
        entity.typeProbleme = undefined;
      } else {
        const type = await this.typeRepo.findOne({ where: { id: dto.typeProblemeId } });
        if (!type) throw new NotFoundException('Type de problème non trouvé');
        entity.typeProbleme = type;
      }
    }

    if (dto.utilisateurId !== undefined) {
      const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
      if (!user) throw new NotFoundException('Utilisateur non trouvé');
      entity.utilisateur = user;
    }

    if (dto.utilisateurResolutionId !== undefined) {
      if (dto.utilisateurResolutionId === null) {
        entity.utilisateurResolution = undefined;
      } else {
        const user = await this.userRepo.findOne({ where: { id: dto.utilisateurResolutionId } });
        if (!user) throw new NotFoundException('Utilisateur de résolution non trouvé');
        entity.utilisateurResolution = user;
      }
    }

    if (dto.entrepriseId !== undefined) {
      if (dto.entrepriseId === null) {
        entity.entreprise = undefined;
      } else {
        const ent = await this.entRepo.findOne({ where: { id: dto.entrepriseId } });
        if (!ent) throw new NotFoundException('Entreprise non trouvée');
        entity.entreprise = ent;
      }
    }

    return this.repo.save(entity);
  }

  async resoudre(id: number, utilisateurResolutionId: number, commentaire?: string) {
    const entity = await this.findOne(id);
    const user = await this.userRepo.findOne({ where: { id: utilisateurResolutionId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    entity.statut = StatutSignalement.RESOLU;
    entity.dateResolution = new Date();
    entity.utilisateurResolution = user;
    if (commentaire) entity.commentaireResolution = commentaire;

    return this.repo.save(entity);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
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
          priorite: s.priorite,
          dateSignalement: s.dateSignalement,
          typeProbleme: s.typeProbleme ? {
            id: s.typeProbleme.id,
            nom: s.typeProbleme.nom,
            icone: s.typeProbleme.icone,
            couleur: s.typeProbleme.couleur,
          } : null,
          adresse: s.adresse,
          photoUrl: s.photoUrl,
        },
      })),
    };
  }

  async getGeoJSON(statut?: string) {
    const signalements = statut ? await this.findByStatut(statut) : await this.findAll();
    return this.formatGeoJSON(signalements);
  }

  // Statistiques
  async getStatistiques() {
    const total = await this.repo.count();
    const actifs = await this.repo.count({ where: { statut: StatutSignalement.ACTIF } });
    const enCours = await this.repo.count({ where: { statut: StatutSignalement.EN_COURS } });
    const resolus = await this.repo.count({ where: { statut: StatutSignalement.RESOLU } });
    const rejetes = await this.repo.count({ where: { statut: StatutSignalement.REJETE } });

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

    return {
      total,
      parStatut: { actifs, enCours, resolus, rejetes },
      parType,
    };
  }
}
