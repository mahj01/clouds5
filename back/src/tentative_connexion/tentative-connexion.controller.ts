import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TentativeConnexionService } from './tentative-connexion.service';
import { CreateTentativeConnexionDto } from './dto/create-tentative-connexion.dto';
import { UpdateTentativeConnexionDto } from './dto/update-tentative-connexion.dto';

@ApiTags('tentatives-connexion')
@ApiBearerAuth()
@Controller('tentatives-connexion')
export class TentativeConnexionController {
  constructor(private readonly svc: TentativeConnexionService) {}

  @Get()
  @ApiOperation({ summary: 'List tentatives-connexion' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateTentativeConnexionDto) {
    return this.svc.create(dto);
  }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTentativeConnexionDto) {
    return this.svc.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
