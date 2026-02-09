import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synchronisation } from './synchronisation.entity';
import { CreateSynchronisationDto } from './dto/create-synchronisation.dto';
import { UpdateSynchronisationDto } from './dto/update-synchronisation.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Injectable()
export class SynchronisationsService {
  constructor(
    @InjectRepository(Synchronisation)
    private repo: Repository<Synchronisation>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
  ) {}

  async create(dto: CreateSynchronisationDto) {
    const manager = await this.userRepo.findOne({
      where: { id: dto.managerId },
    });
    if (!manager)
      throw new NotFoundException('Manager (Utilisateur) not found');
    const entity = this.repo.create({
      typeSync: dto.typeSync,
      statut: dto.statut,
      manager,
    });
    return this.repo.save(entity);
  }
  findAll() {
    return this.repo.find({ relations: ['manager'] });
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['manager'],
    });
    if (!item) throw new NotFoundException('Synchronisation not found');
    return item;
  }
  async update(id: number, dto: UpdateSynchronisationDto) {
    const entity = await this.findOne(id);
    if (dto.typeSync !== undefined) entity.typeSync = dto.typeSync;
    if (dto.statut !== undefined) entity.statut = dto.statut;
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
