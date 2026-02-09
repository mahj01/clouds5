import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriqueSignalement } from './historique-signalement.entity';
import { CreateHistoriqueSignalementDto } from './dto/create-historique-signalement.dto';
import { UpdateHistoriqueSignalementDto } from './dto/update-historique-signalement.dto';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Injectable()
export class HistoriqueSignalementService {
  constructor(
    @InjectRepository(HistoriqueSignalement) private repo: Repository<HistoriqueSignalement>,
    @InjectRepository(Signalement) private sigRepo: Repository<Signalement>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
  ) {}

  async create(dto: CreateHistoriqueSignalementDto) {
    const signalement = await this.sigRepo.findOne({ where: { id: dto.signalementId } });
    if (!signalement) throw new NotFoundException('Signalement not found');
    const manager = await this.userRepo.findOne({ where: { id: dto.managerId } });
    if (!manager) throw new NotFoundException('Manager (Utilisateur) not found');
    const entity = this.repo.create({
      ancienStatut: dto.ancienStatut,
      nouveauStatut: dto.nouveauStatut,
      signalement,
      manager,
    });
    return this.repo.save(entity);
  }
  findAll() {
    return this.repo.find({ relations: ['signalement', 'manager'], order: { dateChangement: 'DESC' } });
  }

  findBySignalement(signalementId: number) {
    return this.repo.find({
      where: { signalement: { id: signalementId } },
      relations: ['manager'],
      order: { dateChangement: 'DESC' },
    });
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ['signalement', 'manager'] });
    if (!item) throw new NotFoundException('HistoriqueSignalement not found');
    return item;
  }
  async update(id: number, dto: UpdateHistoriqueSignalementDto) {
    const entity = await this.findOne(id);
    if (dto.ancienStatut !== undefined) entity.ancienStatut = dto.ancienStatut;
    if (dto.nouveauStatut !== undefined) entity.nouveauStatut = dto.nouveauStatut;
    if (dto.signalementId !== undefined) {
      const s = await this.sigRepo.findOne({ where: { id: dto.signalementId } });
      if (!s) throw new NotFoundException('Signalement not found');
      entity.signalement = s;
    }
    if (dto.managerId !== undefined) {
      const m = await this.userRepo.findOne({ where: { id: dto.managerId } });
      if (!m) throw new NotFoundException('Manager (Utilisateur) not found');
      entity.manager = m;
    }
    return this.repo.save(entity);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
