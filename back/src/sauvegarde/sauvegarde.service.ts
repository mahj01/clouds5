import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Sauvegarde } from './sauvegarde.entity';
import { CreateSauvegardeDto } from './dto/create-sauvegarde.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Entreprise } from '../entreprises/entreprise.entity';

@Injectable()
export class SauvegardeService {
  private backupDir = path.join(process.cwd(), 'backups');

  constructor(
    @InjectRepository(Sauvegarde) private repo: Repository<Sauvegarde>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
    @InjectRepository(Signalement)
    private signalementRepo: Repository<Signalement>,
    @InjectRepository(Entreprise)
    private entrepriseRepo: Repository<Entreprise>,
  ) {
    // Créer le dossier de backup s'il n'existe pas
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async create(dto: CreateSauvegardeDto): Promise<Sauvegarde> {
    let creePar: Utilisateur | undefined;
    if (dto.utilisateurId) {
      const user = await this.userRepo.findOne({
        where: { id: dto.utilisateurId },
      });
      if (user) creePar = user;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nom = dto.nom || `backup_${dto.type}_${timestamp}`;

    const sauvegarde = this.repo.create({
      nom,
      type: dto.type,
      statut: 'en_cours',
      creePar,
    });

    const saved = await this.repo.save(sauvegarde);

    // Lancer la sauvegarde de manière asynchrone
    this.executerSauvegarde(saved.id, dto.type);

    return saved;
  }

  private async executerSauvegarde(
    sauvegardeId: number,
    type: string,
  ): Promise<void> {
    try {
      let data: any;
      let count = 0;

      switch (type) {
        case 'signalements':
          data = await this.signalementRepo.find({
            relations: ['utilisateur', 'entreprise'],
          });
          count = data.length;
          break;
        case 'entreprises':
          data = await this.entrepriseRepo.find();
          count = data.length;
          break;
        case 'complete':
          const signalements = await this.signalementRepo.find({
            relations: ['utilisateur', 'entreprise'],
          });
          const entreprises = await this.entrepriseRepo.find();
          data = { signalements, entreprises };
          count = signalements.length + entreprises.length;
          break;
        default:
          throw new Error(`Type de sauvegarde inconnu: ${type}`);
      }

      // Convertir en GeoJSON pour les données cartographiques
      const geojsonData = this.convertToGeoJSON(data, type);

      const fileName = `backup_${type}_${sauvegardeId}_${Date.now()}.geojson`;
      const filePath = path.join(this.backupDir, fileName);

      const jsonContent = JSON.stringify(geojsonData, null, 2);
      fs.writeFileSync(filePath, jsonContent);

      const stats = fs.statSync(filePath);

      await this.repo.update(sauvegardeId, {
        statut: 'termine',
        cheminFichier: filePath,
        tailleFichier: stats.size,
        nombreElements: count,
        dateFin: new Date(),
        metadata: JSON.stringify({
          format: 'geojson',
          version: '1.0',
          dateExport: new Date().toISOString(),
        }),
      });
    } catch (error) {
      await this.repo.update(sauvegardeId, {
        statut: 'erreur',
        erreur: error.message || String(error),
        dateFin: new Date(),
      });
    }
  }

  private convertToGeoJSON(data: any, type: string): any {
    if (type === 'complete') {
      return {
        type: 'FeatureCollection',
        metadata: {
          type: 'complete_backup',
          exportedAt: new Date().toISOString(),
        },
        features: [...this.signalementToFeatures(data.signalements || [])],
        entreprises: data.entreprises || [],
      };
    }

    if (type === 'signalements') {
      return {
        type: 'FeatureCollection',
        metadata: {
          type: 'signalements',
          exportedAt: new Date().toISOString(),
        },
        features: this.signalementToFeatures(data),
      };
    }

    if (type === 'entreprises') {
      return {
        type: 'FeatureCollection',
        metadata: {
          type: 'entreprises',
          exportedAt: new Date().toISOString(),
        },
        features: [],
        entreprises: data,
      };
    }

    return data;
  }

  private signalementToFeatures(signalements: Signalement[]): any[] {
    return signalements.map((s) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(s.longitude) || 0,
          parseFloat(s.latitude) || 0,
        ],
      },
      properties: {
        id: s.id,
        titre: s.titre,
        description: s.description,
        statut: s.statut,
        surfaceM2: s.surfaceM2,
        budget: s.budget,
        dateSignalement: s.dateSignalement,
        utilisateurId: s.utilisateur?.id,
        entrepriseId: s.entreprise?.id,
        entrepriseNom: s.entreprise?.nom,
      },
    }));
  }

  async findAll(): Promise<Sauvegarde[]> {
    return this.repo.find({
      relations: ['creePar'],
      order: { dateCreation: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Sauvegarde> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['creePar'],
    });
    if (!item) throw new NotFoundException('Sauvegarde non trouvée');
    return item;
  }

  async telecharger(
    id: number,
  ): Promise<{ filePath: string; fileName: string }> {
    const sauvegarde = await this.findOne(id);
    if (!sauvegarde.cheminFichier || sauvegarde.statut !== 'termine') {
      throw new NotFoundException('Fichier de sauvegarde non disponible');
    }
    if (!fs.existsSync(sauvegarde.cheminFichier)) {
      throw new NotFoundException(
        'Fichier de sauvegarde introuvable sur le disque',
      );
    }
    return {
      filePath: sauvegarde.cheminFichier,
      fileName: path.basename(sauvegarde.cheminFichier),
    };
  }

  async supprimer(id: number): Promise<void> {
    const sauvegarde = await this.findOne(id);
    if (sauvegarde.cheminFichier && fs.existsSync(sauvegarde.cheminFichier)) {
      fs.unlinkSync(sauvegarde.cheminFichier);
    }
    await this.repo.remove(sauvegarde);
  }

  async getStatistiques(): Promise<{
    totalSauvegardes: number;
    tailleTotal: number;
    dernieresSauvegardes: Sauvegarde[];
  }> {
    const totalSauvegardes = await this.repo.count();

    const result = await this.repo
      .createQueryBuilder('s')
      .select('SUM(s.tailleFichier)', 'total')
      .where('s.statut = :statut', { statut: 'termine' })
      .getRawOne();

    const dernieresSauvegardes = await this.repo.find({
      relations: ['creePar'],
      order: { dateCreation: 'DESC' },
      take: 5,
    });

    return {
      totalSauvegardes,
      tailleTotal: Number(result?.total) || 0,
      dernieresSauvegardes,
    };
  }
}
