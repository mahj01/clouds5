import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { StatutCompteService } from './statut-compte.service';
import { CreateStatutCompteDto } from './dto/create-statut-compte.dto';
import { UpdateStatutCompteDto } from './dto/update-statut-compte.dto';

@ApiTags('statuts-compte')
@Controller('statuts-compte')
export class StatutCompteController {
  constructor(private readonly svc: StatutCompteService) {}

  @Get()
  @ApiOperation({ summary: 'List statuts-compte' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateStatutCompteDto) {
    return this.svc.create(dto);
  }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatutCompteDto) {
    return this.svc.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
