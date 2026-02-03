import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeProbleme } from './type-probleme.entity';
import { CreateTypeProblemeDto } from './dto/create-type-probleme.dto';
import { UpdateTypeProblemeDto } from './dto/update-type-probleme.dto';

@Injectable()
export class TypesProblemesService {
  constructor(
    @InjectRepository(TypeProbleme) private repo: Repository<TypeProbleme>,
  ) {}

  create(dto: CreateTypeProblemeDto) {
    const entity = this.repo.create({
      nom: dto.nom,
      description: dto.description,
      icone: dto.icone,
      couleur: dto.couleur ?? '#FF5733',
      actif: dto.actif ?? true,
    });
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ order: { nom: 'ASC' } });
  }

  findAllActifs() {
    return this.repo.find({ where: { actif: true }, order: { nom: 'ASC' } });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Type de problème non trouvé');
    return item;
  }

  async update(id: number, dto: UpdateTypeProblemeDto) {
    const entity = await this.findOne(id);
    if (dto.nom !== undefined) entity.nom = dto.nom;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.icone !== undefined) entity.icone = dto.icone;
    if (dto.couleur !== undefined) entity.couleur = dto.couleur;
    if (dto.actif !== undefined) entity.actif = dto.actif;
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
