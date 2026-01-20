import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post() create(@Body() dto: CreateCategoryDto) {
    return this.svc.create(dto);
  }
  @Put(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.svc.update(id, dto);
  }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
  @Get('search/:term') findByNameLike(@Param('term') term: string) {
    return this.svc.findByNameLike(term);
  }
}
