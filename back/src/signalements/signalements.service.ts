import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signalement } from './signalement.entity';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { UpdateSignalementDto } from './dto/update-signalement.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';

@Injectable()
export class SignalementsService {
  constructor(
    @InjectRepository(Signalement) private repo: Repository<Signalement>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
    @InjectRepository(Entreprise) private entRepo: Repository<Entreprise>,
  ) {}

  async create(dto: CreateSignalementDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
    if (!user) throw new NotFoundException('Utilisateur not found');
    let entreprise: Entreprise | undefined;
    if (dto.entrepriseId) {
      const ent = await this.entRepo.findOne({ where: { id: dto.entrepriseId } });
      if (!ent) throw new NotFoundException('Entreprise not found');
      entreprise = ent;
    }
    const entity = this.repo.create({
      titre: dto.titre,
      description: dto.description,
      latitude: String(dto.latitude),
      longitude: String(dto.longitude),
      statut: dto.statut ?? 'nouveau',
      surfaceM2: dto.surfaceM2 !== undefined ? String(dto.surfaceM2) : undefined,
      budget: dto.budget !== undefined ? String(dto.budget) : undefined,
      utilisateur: user,
      entreprise,
    });
    return this.repo.save(entity);
  }
  findAll() {
    return this.repo.find({ relations: ['utilisateur', 'entreprise'] });
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ['utilisateur', 'entreprise'] });
    if (!item) throw new NotFoundException('Signalement not found');
    return item;
  }
  async update(id: number, dto: UpdateSignalementDto) {
    const entity = await this.findOne(id);
    if (dto.titre !== undefined) entity.titre = dto.titre;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.latitude !== undefined) entity.latitude = String(dto.latitude);
    if (dto.longitude !== undefined) entity.longitude = String(dto.longitude);
    if (dto.statut !== undefined) entity.statut = dto.statut;
    if (dto.surfaceM2 !== undefined) entity.surfaceM2 = String(dto.surfaceM2);
    if (dto.budget !== undefined) entity.budget = String(dto.budget);
    if (dto.utilisateurId !== undefined) {
      const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
      if (!user) throw new NotFoundException('Utilisateur not found');
      entity.utilisateur = user;
    }
    if (dto.entrepriseId !== undefined) {
      if (dto.entrepriseId === null) {
        entity.entreprise = undefined;
      } else {
        const ent = await this.entRepo.findOne({ where: { id: dto.entrepriseId } });
        if (!ent) throw new NotFoundException('Entreprise not found');
        entity.entreprise = ent;
      }
    }
    return this.repo.save(entity);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
