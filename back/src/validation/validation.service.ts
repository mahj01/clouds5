import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Validation } from './validation.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { ValiderSignalementDto } from './dto/validation.dto';

export interface ValidationResult {
  coordonneesValides: boolean;
  donneesCompletes: boolean;
  coherenceDonnees: boolean;
  erreurs: string[];
}

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(Validation) private repo: Repository<Validation>,
    @InjectRepository(Signalement) private signalementRepo: Repository<Signalement>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
  ) {}

  // Validation automatique des données cartographiques
  private validerDonnees(signalement: Signalement): ValidationResult {
    const erreurs: string[] = [];
    
    // Validation des coordonnées
    const lat = parseFloat(signalement.latitude);
    const lng = parseFloat(signalement.longitude);
    const coordonneesValides = 
      !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      // Vérification que les coordonnées sont dans la zone d'Antananarivo (approximativement)
      lat >= -19.5 && lat <= -18.5 &&
      lng >= 47 && lng <= 48;

    if (!coordonneesValides) {
      if (isNaN(lat) || isNaN(lng)) {
        erreurs.push('Coordonnées invalides ou manquantes');
      } else if (lat < -19.5 || lat > -18.5 || lng < 47 || lng > 48) {
        erreurs.push('Coordonnées hors zone Antananarivo');
      } else {
        erreurs.push('Coordonnées hors limites géographiques');
      }
    }

    // Validation de la complétude des données
    const donneesCompletes = 
      !!signalement.titre &&
      signalement.titre.trim().length >= 3 &&
      !!signalement.statut;

    if (!signalement.titre || signalement.titre.trim().length < 3) {
      erreurs.push('Titre manquant ou trop court (minimum 3 caractères)');
    }
    if (!signalement.statut) {
      erreurs.push('Statut manquant');
    }

    // Validation de la cohérence des données
    let coherenceDonnees = true;
    
    if (signalement.surfaceM2) {
      const surface = parseFloat(signalement.surfaceM2);
      if (isNaN(surface) || surface < 0 || surface > 100000) {
        coherenceDonnees = false;
        erreurs.push('Surface invalide (doit être entre 0 et 100000 m²)');
      }
    }

    if (signalement.budget) {
      const budget = parseFloat(signalement.budget);
      if (isNaN(budget) || budget < 0) {
        coherenceDonnees = false;
        erreurs.push('Budget invalide (doit être positif)');
      }
    }

    const statutsValides = ['nouveau', 'en cours', 'terminé', 'termine', 'encours'];
    if (signalement.statut && !statutsValides.includes(signalement.statut.toLowerCase())) {
      coherenceDonnees = false;
      erreurs.push(`Statut non reconnu: ${signalement.statut}`);
    }

    return {
      coordonneesValides,
      donneesCompletes,
      coherenceDonnees,
      erreurs,
    };
  }

  async validerSignalement(signalementId: number, dto: ValiderSignalementDto): Promise<Validation> {
    const signalement = await this.signalementRepo.findOne({
      where: { id: signalementId },
      relations: ['utilisateur', 'entreprise'],
    });
    if (!signalement) throw new NotFoundException('Signalement non trouvé');

    let validePar: Utilisateur | undefined;
    if (dto.validePar) {
      const user = await this.userRepo.findOne({ where: { id: dto.validePar } });
      if (user) validePar = user;
    }

    const resultAuto = this.validerDonnees(signalement);

    // Chercher une validation existante ou en créer une nouvelle
    let validation = await this.repo.findOne({
      where: { signalement: { id: signalementId } },
    });

    if (validation) {
      validation.statut = dto.statut;
      validation.commentaire = dto.commentaire;
      validation.validePar = validePar;
      validation.coordonneesValides = resultAuto.coordonneesValides;
      validation.donneesCompletes = resultAuto.donneesCompletes;
      validation.coherenceDonnees = resultAuto.coherenceDonnees;
      validation.erreursDetectees = resultAuto.erreurs.length > 0 ? JSON.stringify(resultAuto.erreurs) : undefined;
    } else {
      validation = this.repo.create({
        signalement,
        statut: dto.statut,
        commentaire: dto.commentaire,
        validePar,
        coordonneesValides: resultAuto.coordonneesValides,
        donneesCompletes: resultAuto.donneesCompletes,
        coherenceDonnees: resultAuto.coherenceDonnees,
        erreursDetectees: resultAuto.erreurs.length > 0 ? JSON.stringify(resultAuto.erreurs) : undefined,
      });
    }

    return this.repo.save(validation);
  }

  async validerAuto(signalementId: number): Promise<{
    signalementId: number;
    resultat: ValidationResult;
    statutSuggere: string;
  }> {
    const signalement = await this.signalementRepo.findOne({
      where: { id: signalementId },
    });
    if (!signalement) throw new NotFoundException('Signalement non trouvé');

    const resultat = this.validerDonnees(signalement);
    
    let statutSuggere = 'valide';
    if (resultat.erreurs.length > 0) {
      statutSuggere = resultat.coordonneesValides && resultat.donneesCompletes ? 'a_corriger' : 'rejete';
    }

    return {
      signalementId,
      resultat,
      statutSuggere,
    };
  }

  async validerTousAuto(): Promise<{
    total: number;
    valides: number;
    aVerifier: number;
    rejetes: number;
    details: Array<{ id: number; statut: string; erreurs: string[] }>;
  }> {
    const signalements = await this.signalementRepo.find();
    
    let valides = 0;
    let aVerifier = 0;
    let rejetes = 0;
    const details: Array<{ id: number; statut: string; erreurs: string[] }> = [];

    for (const signalement of signalements) {
      const resultat = this.validerDonnees(signalement);
      
      let statut = 'valide';
      if (resultat.erreurs.length > 0) {
        if (!resultat.coordonneesValides || !resultat.donneesCompletes) {
          statut = 'rejete';
          rejetes++;
        } else {
          statut = 'a_corriger';
          aVerifier++;
        }
      } else {
        valides++;
      }

      details.push({
        id: signalement.id,
        statut,
        erreurs: resultat.erreurs,
      });

      // Créer ou mettre à jour la validation
      let validation = await this.repo.findOne({
        where: { signalement: { id: signalement.id } },
      });

      if (validation) {
        validation.statut = statut === 'valide' ? 'en_attente' : statut;
        validation.coordonneesValides = resultat.coordonneesValides;
        validation.donneesCompletes = resultat.donneesCompletes;
        validation.coherenceDonnees = resultat.coherenceDonnees;
        validation.erreursDetectees = resultat.erreurs.length > 0 ? JSON.stringify(resultat.erreurs) : undefined;
      } else {
        validation = this.repo.create({
          signalement,
          statut: statut === 'valide' ? 'en_attente' : statut,
          coordonneesValides: resultat.coordonneesValides,
          donneesCompletes: resultat.donneesCompletes,
          coherenceDonnees: resultat.coherenceDonnees,
          erreursDetectees: resultat.erreurs.length > 0 ? JSON.stringify(resultat.erreurs) : undefined,
        });
      }

      await this.repo.save(validation);
    }

    return {
      total: signalements.length,
      valides,
      aVerifier,
      rejetes,
      details,
    };
  }

  async findAll(): Promise<Validation[]> {
    return this.repo.find({
      relations: ['signalement', 'signalement.utilisateur', 'signalement.entreprise', 'validePar'],
      order: { dateValidation: 'DESC' },
    });
  }

  async findByStatut(statut: string): Promise<Validation[]> {
    return this.repo.find({
      where: { statut },
      relations: ['signalement', 'signalement.utilisateur', 'signalement.entreprise', 'validePar'],
      order: { dateValidation: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Validation> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['signalement', 'signalement.utilisateur', 'signalement.entreprise', 'validePar'],
    });
    if (!item) throw new NotFoundException('Validation non trouvée');
    return item;
  }

  async getStatistiques(): Promise<{
    total: number;
    enAttente: number;
    valides: number;
    rejetes: number;
    aCorreiger: number;
    tauxValidation: number;
  }> {
    const total = await this.repo.count();
    const enAttente = await this.repo.count({ where: { statut: 'en_attente' } });
    const valides = await this.repo.count({ where: { statut: 'valide' } });
    const rejetes = await this.repo.count({ where: { statut: 'rejete' } });
    const aCorreiger = await this.repo.count({ where: { statut: 'a_corriger' } });

    const tauxValidation = total > 0 ? Math.round((valides / total) * 100) : 0;

    return {
      total,
      enAttente,
      valides,
      rejetes,
      aCorreiger,
      tauxValidation,
    };
  }

  async getSignalementsNonValides(): Promise<Signalement[]> {
    // Récupérer les IDs des signalements déjà validés
    const validations = await this.repo.find({
      relations: ['signalement'],
    });
    const idsValides = validations.map(v => v.signalement?.id).filter(Boolean);

    if (idsValides.length === 0) {
      return this.signalementRepo.find({ relations: ['utilisateur', 'entreprise'] });
    }

    return this.signalementRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.utilisateur', 'utilisateur')
      .leftJoinAndSelect('s.entreprise', 'entreprise')
      .where('s.id NOT IN (:...ids)', { ids: idsValides })
      .getMany();
  }
}
