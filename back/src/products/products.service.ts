import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../categories/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private prodRepo: Repository<Product>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.prodRepo.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.prodRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.catRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    const product = this.prodRepo.create({
      name: dto.name,
      price: dto.price,
      category,
    });
    return this.prodRepo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.categoryId !== undefined) {
      const category = await this.catRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      product.category = category;
    }
    return this.prodRepo.save(product);
  }

  async remove(id: number): Promise<void> {
    const res = await this.prodRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Product not found');
  }
}
