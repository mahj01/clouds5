import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatutCompte } from './statut-compte.entity';
import { CreateStatutCompteDto } from './dto/create-statut-compte.dto';
import { UpdateStatutCompteDto } from './dto/update-statut-compte.dto';

@Injectable()
export class StatutCompteService {
  constructor(@InjectRepository(StatutCompte) private repo: Repository<StatutCompte>) {}

  create(dto: CreateStatutCompteDto) {
    return this.repo.save(this.repo.create(dto));
  }
  findAll() {
    return this.repo.find();
  }
  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('StatutCompte not found');
    return item;
  }
  async update(id: number, dto: UpdateStatutCompteDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
