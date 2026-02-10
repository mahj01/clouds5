import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NiveauReparation } from './niveau-reparation.entity';
import { CreateNiveauReparationDto } from './dto/create-niveau-reparation.dto';
import { UpdateNiveauReparationDto } from './dto/update-niveau-reparation.dto';

@Injectable()
export class NiveauxReparationService {
  constructor(
    @InjectRepository(NiveauReparation)
    private repo: Repository<NiveauReparation>,
  ) {}

  async create(dto: CreateNiveauReparationDto) {
    // Vérifier que le niveau n'existe pas déjà
    const existing = await this.repo.findOne({
      where: { niveau: dto.niveau },
    });
    if (existing) {
      throw new BadRequestException(
        `Le niveau ${dto.niveau} existe déjà`,
      );
    }
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { niveau: 'ASC' } });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Niveau de réparation non trouvé');
    }
    return item;
  }

  async findByNiveau(niveau: number) {
    const item = await this.repo.findOne({ where: { niveau } });
    if (!item) {
      throw new NotFoundException(
        `Niveau de réparation ${niveau} non trouvé`,
      );
    }
    return item;
  }

  async update(id: number, dto: UpdateNiveauReparationDto) {
    // Si on change le niveau, vérifier qu'il n'existe pas déjà
    if (dto.niveau !== undefined) {
      const existing = await this.repo.findOne({
        where: { niveau: dto.niveau },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Le niveau ${dto.niveau} est déjà utilisé`,
        );
      }
    }
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
