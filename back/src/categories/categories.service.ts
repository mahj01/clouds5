import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  create(dto: CreateCategoryDto) {
    return this.repo.save(this.repo.create(dto));
  }
  findAll() {
    return this.repo.find();
  }
  async findOne(id: number) {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }
  async update(id: number, dto: UpdateCategoryDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }
  async remove(id: number) {
    const c = await this.findOne(id);
    return this.repo.remove(c);
  }
  async findByNameLike(term: string) {
    return this.repo
      .createQueryBuilder('c')
      .where('c.name ILIKE :t', { t: `%${term}%` })
      .getMany();
  }
}
