import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TentativeConnexion } from './tentative-connexion.entity';
import { CreateTentativeConnexionDto } from './dto/create-tentative-connexion.dto';
import { UpdateTentativeConnexionDto } from './dto/update-tentative-connexion.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Injectable()
export class TentativeConnexionService {
  constructor(
    @InjectRepository(TentativeConnexion) private repo: Repository<TentativeConnexion>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
  ) {}

  async create(dto: CreateTentativeConnexionDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
    if (!user) throw new NotFoundException('Utilisateur not found');
    const entity = this.repo.create({ succes: dto.succes, ip: dto.ip, utilisateur: user });
    return this.repo.save(entity);
  }
  findAll() {
    return this.repo.find({ relations: ['utilisateur'] });
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ['utilisateur'] });
    if (!item) throw new NotFoundException('TentativeConnexion not found');
    return item;
  }
  async update(id: number, dto: UpdateTentativeConnexionDto) {
    const entity = await this.findOne(id);
    if (dto.succes !== undefined) entity.succes = dto.succes;
    if (dto.ip !== undefined) entity.ip = dto.ip;
    if (dto.utilisateurId !== undefined) {
      const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
      if (!user) throw new NotFoundException('Utilisateur not found');
      entity.utilisateur = user;
    }
    return this.repo.save(entity);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
