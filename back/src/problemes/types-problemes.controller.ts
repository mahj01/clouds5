import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TypesProblemesService } from './types-problemes.service';
import { CreateTypeProblemeDto } from './dto/create-type-probleme.dto';
import { UpdateTypeProblemeDto } from './dto/update-type-probleme.dto';

@ApiTags('types-problemes')
@ApiBearerAuth()
@Controller('types-problemes')
export class TypesProblemesController {
  constructor(private readonly svc: TypesProblemesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les types de problèmes' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('actifs')
  @ApiOperation({ summary: 'Liste uniquement les types de problèmes actifs' })
  findAllActifs() {
    return this.svc.findAllActifs();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupère un type de problème par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crée un nouveau type de problème' })
  @ApiResponse({ status: 201, description: 'Type créé.' })
  create(@Body() dto: CreateTypeProblemeDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Met à jour un type de problème' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTypeProblemeDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprime un type de problème' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
