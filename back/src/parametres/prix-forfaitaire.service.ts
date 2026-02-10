import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrixForfaitaire } from './entities/prix-forfaitaire.entity';
import { CreatePrixForfaitaireDto } from './dto/create-prix-forfaitaire.dto';
import { UpdatePrixForfaitaireDto } from './dto/update-prix-forfaitaire.dto';

@Injectable()
export class PrixForfaitaireService {
  constructor(
    @InjectRepository(PrixForfaitaire)
    private repo: Repository<PrixForfaitaire>,
  ) {}

  async create(dto: CreatePrixForfaitaireDto): Promise<PrixForfaitaire> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  findAll(): Promise<PrixForfaitaire[]> {
    return this.repo.find({
      order: { libelle: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PrixForfaitaire> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Prix forfaitaire #${id} non trouvé`);
    }
    return item;
  }

  async update(
    id: number,
    dto: UpdatePrixForfaitaireDto,
  ): Promise<PrixForfaitaire> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
