import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriqueStatusUtilisateur } from './historique-status-utilisateur.entity';
import { CreateHistoriqueStatusUtilisateurDto } from './dto/create-historique-status-utilisateur.dto';
import { UpdateHistoriqueStatusUtilisateurDto } from './dto/update-historique-status-utilisateur.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';

@Injectable()
export class HistoriqueStatusUtilisateurService {
  constructor(
    @InjectRepository(HistoriqueStatusUtilisateur)
    private repo: Repository<HistoriqueStatusUtilisateur>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
    @InjectRepository(StatutCompte)
    private statutRepo: Repository<StatutCompte>,
  ) {}

  async create(dto: CreateHistoriqueStatusUtilisateurDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.utilisateurId },
    });
    if (!user) throw new NotFoundException('Utilisateur not found');
    const statut = await this.statutRepo.findOne({
      where: { id: dto.statutCompteId },
    });
    if (!statut) throw new NotFoundException('StatutCompte not found');
    const entity = this.repo.create({ utilisateur: user, statut });
    return this.repo.save(entity);
  }
  findAll() {
    return this.repo.find({ relations: ['utilisateur', 'statut'] });
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['utilisateur', 'statut'],
    });
    if (!item)
      throw new NotFoundException('HistoriqueStatusUtilisateur not found');
    return item;
  }
  async update(id: number, dto: UpdateHistoriqueStatusUtilisateurDto) {
    const entity = await this.findOne(id);
    if (dto.utilisateurId !== undefined) {
      const user = await this.userRepo.findOne({
        where: { id: dto.utilisateurId },
      });
      if (!user) throw new NotFoundException('Utilisateur not found');
      entity.utilisateur = user;
    }
    if (dto.statutCompteId !== undefined) {
      const statut = await this.statutRepo.findOne({
        where: { id: dto.statutCompteId },
      });
      if (!statut) throw new NotFoundException('StatutCompte not found');
      entity.statut = statut;
    }
    return this.repo.save(entity);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
