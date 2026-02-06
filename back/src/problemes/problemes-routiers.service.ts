import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProblemeRoutier, StatutProbleme } from './probleme-routier.entity';
import { CreateProblemeRoutierDto } from './dto/create-probleme-routier.dto';
import { UpdateProblemeRoutierDto } from './dto/update-probleme-routier.dto';
import { TypeProbleme } from './type-probleme.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';

@Injectable()
export class ProblemesRoutiersService {
  constructor(
    @InjectRepository(ProblemeRoutier) private repo: Repository<ProblemeRoutier>,
    @InjectRepository(TypeProbleme) private typeRepo: Repository<TypeProbleme>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
    @InjectRepository(Signalement) private signalementRepo: Repository<Signalement>,
  ) {}

  async create(dto: CreateProblemeRoutierDto) {
    const typeProbleme = await this.typeRepo.findOne({ where: { id: dto.typeProblemeId } });
    if (!typeProbleme) throw new NotFoundException('Type de problème non trouvé');
    if (!typeProbleme.actif) throw new BadRequestException('Ce type de problème n\'est plus actif');

    const utilisateur = await this.userRepo.findOne({ where: { id: dto.utilisateurSignaleurId } });
    if (!utilisateur) throw new NotFoundException('Utilisateur non trouvé');

    // Créer d'abord un signalement dans la table signalement
    const signalement = this.signalementRepo.create({
      titre: dto.titre,
      description: dto.description,
      latitude: String(dto.latitude),
      longitude: String(dto.longitude),
      statut: this.mapStatutToSignalement(dto.statut ?? StatutProbleme.ACTIF),
      utilisateur,
    });
    const savedSignalement = await this.signalementRepo.save(signalement);

    // Créer le problème routier lié au signalement
    const entity = this.repo.create({
      titre: dto.titre,
      description: dto.description,
      latitude: String(dto.latitude),
      longitude: String(dto.longitude),
      adresse: dto.adresse,
      statut: dto.statut ?? StatutProbleme.ACTIF,
      priorite: dto.priorite ?? 1,
      photoUrl: dto.photoUrl,
      typeProbleme,
      utilisateurSignaleur: utilisateur,
      signalement: savedSignalement,
    });
    return this.repo.save(entity);
  }

  // Convertir le statut probleme vers statut signalement
  private mapStatutToSignalement(statut: StatutProbleme): string {
    switch (statut) {
      case StatutProbleme.ACTIF: return 'nouveau';
      case StatutProbleme.EN_COURS: return 'en_cours';
      case StatutProbleme.RESOLU: return 'termine';
      case StatutProbleme.REJETE: return 'rejete';
      default: return 'nouveau';
    }
  }

  findAll() {
    return this.repo.find({
      relations: ['typeProbleme', 'utilisateurSignaleur', 'utilisateurResolution', 'signalement'],
      order: { dateSignalement: 'DESC' },
    });
  }

  findAllActifs() {
    return this.repo.find({
      where: { statut: StatutProbleme.ACTIF },
      relations: ['typeProbleme', 'utilisateurSignaleur', 'signalement'],
      order: { priorite: 'DESC', dateSignalement: 'DESC' },
    });
  }

  findByStatut(statut: StatutProbleme) {
    return this.repo.find({
      where: { statut },
      relations: ['typeProbleme', 'utilisateurSignaleur', 'utilisateurResolution', 'signalement'],
      order: { dateSignalement: 'DESC' },
    });
  }

  findByType(typeId: number) {
    return this.repo.find({
      where: { typeProbleme: { id: typeId } },
      relations: ['typeProbleme', 'utilisateurSignaleur', 'signalement'],
      order: { dateSignalement: 'DESC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['typeProbleme', 'utilisateurSignaleur', 'utilisateurResolution', 'signalement'],
    });
    if (!item) throw new NotFoundException('Problème routier non trouvé');
    return item;
  }

  async update(id: number, dto: UpdateProblemeRoutierDto) {
    const entity = await this.findOne(id);

    if (dto.titre !== undefined) entity.titre = dto.titre;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.latitude !== undefined) entity.latitude = String(dto.latitude);
    if (dto.longitude !== undefined) entity.longitude = String(dto.longitude);
    if (dto.adresse !== undefined) entity.adresse = dto.adresse;
    if (dto.priorite !== undefined) entity.priorite = dto.priorite;
    if (dto.photoUrl !== undefined) entity.photoUrl = dto.photoUrl;
    if (dto.commentaireResolution !== undefined) entity.commentaireResolution = dto.commentaireResolution;

    if (dto.statut !== undefined) {
      entity.statut = dto.statut;
      if (dto.statut === StatutProbleme.RESOLU) {
        entity.dateResolution = new Date();
      }
      // Synchroniser le statut avec le signalement lié
      if (entity.signalement) {
        entity.signalement.statut = this.mapStatutToSignalement(dto.statut);
        await this.signalementRepo.save(entity.signalement);
      }
    }

    if (dto.typeProblemeId !== undefined) {
      const type = await this.typeRepo.findOne({ where: { id: dto.typeProblemeId } });
      if (!type) throw new NotFoundException('Type de problème non trouvé');
      entity.typeProbleme = type;
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

    // Synchroniser titre et description avec le signalement lié
    if (entity.signalement && (dto.titre !== undefined || dto.description !== undefined)) {
      if (dto.titre !== undefined) entity.signalement.titre = dto.titre;
      if (dto.description !== undefined) entity.signalement.description = dto.description;
      await this.signalementRepo.save(entity.signalement);
    }

    return this.repo.save(entity);
  }

  async resoudre(id: number, utilisateurResolutionId: number, commentaire?: string) {
    const entity = await this.findOne(id);
    const user = await this.userRepo.findOne({ where: { id: utilisateurResolutionId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    entity.statut = StatutProbleme.RESOLU;
    entity.dateResolution = new Date();
    entity.utilisateurResolution = user;
    if (commentaire) entity.commentaireResolution = commentaire;

    // Synchroniser avec le signalement lié
    if (entity.signalement) {
      entity.signalement.statut = 'termine';
      await this.signalementRepo.save(entity.signalement);
    }

    return this.repo.save(entity);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    // Supprimer aussi le signalement lié
    if (item.signalement) {
      await this.signalementRepo.remove(item.signalement);
    }
    await this.repo.remove(item);
  }

  // Formatage des données géographiques pour l'API
  formatGeoJSON(problemes: ProblemeRoutier[]) {
    return {
      type: 'FeatureCollection',
      features: problemes.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(p.longitude), parseFloat(p.latitude)],
        },
        properties: {
          id: p.id,
          titre: p.titre,
          description: p.description,
          statut: p.statut,
          priorite: p.priorite,
          dateSignalement: p.dateSignalement,
          typeProbleme: p.typeProbleme ? {
            id: p.typeProbleme.id,
            nom: p.typeProbleme.nom,
            icone: p.typeProbleme.icone,
            couleur: p.typeProbleme.couleur,
          } : null,
          adresse: p.adresse,
          photoUrl: p.photoUrl,
        },
      })),
    };
  }

  async getGeoJSON(statut?: StatutProbleme) {
    const problemes = statut ? await this.findByStatut(statut) : await this.findAll();
    return this.formatGeoJSON(problemes);
  }

  // Statistiques
  async getStatistiques() {
    const total = await this.repo.count();
    const actifs = await this.repo.count({ where: { statut: StatutProbleme.ACTIF } });
    const enCours = await this.repo.count({ where: { statut: StatutProbleme.EN_COURS } });
    const resolus = await this.repo.count({ where: { statut: StatutProbleme.RESOLU } });
    const rejetes = await this.repo.count({ where: { statut: StatutProbleme.REJETE } });

    const parType = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.typeProbleme', 't')
      .select('t.nom', 'type')
      .addSelect('t.couleur', 'couleur')
      .addSelect('COUNT(p.id)', 'count')
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
