import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private repo: Repository<Session>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
  ) {}

  async create(dto: CreateSessionDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.utilisateurId },
    });
    if (!user) throw new NotFoundException('Utilisateur not found');
    const entity = this.repo.create({
      token: dto.token,
      dateExpiration: dto.dateExpiration,
      actif: dto.actif ?? true,
      utilisateur: user,
    });
    return this.repo.save(entity);
  }
  findAll() {
    return this.repo.find({ relations: ['utilisateur'] });
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['utilisateur'],
    });
    if (!item) throw new NotFoundException('Session not found');
    return item;
  }
  async update(id: number, dto: UpdateSessionDto) {
    const entity = await this.findOne(id);
    if (dto.token !== undefined) entity.token = dto.token;
    if (dto.dateExpiration !== undefined)
      entity.dateExpiration = dto.dateExpiration;
    if (dto.actif !== undefined) entity.actif = dto.actif;
    if (dto.utilisateurId !== undefined) {
      const user = await this.userRepo.findOne({
        where: { id: dto.utilisateurId },
      });
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
