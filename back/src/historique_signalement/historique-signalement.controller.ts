import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HistoriqueSignalementService } from './historique-signalement.service';
import { CreateHistoriqueSignalementDto } from './dto/create-historique-signalement.dto';
import { UpdateHistoriqueSignalementDto } from './dto/update-historique-signalement.dto';

@ApiTags('historique-signalement')
@ApiBearerAuth()
@Controller('historique-signalement')
export class HistoriqueSignalementController {
  constructor(private readonly svc: HistoriqueSignalementService) {}

  @Get()
  @ApiOperation({ summary: 'List historique-signalement entries' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('signalement/:signalementId')
  @ApiOperation({ summary: 'Get historique by signalement ID' })
  findBySignalement(@Param('signalementId', ParseIntPipe) signalementId: number) {
    return this.svc.findBySignalement(signalementId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateHistoriqueSignalementDto) {
    return this.svc.create(dto);
  }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHistoriqueSignalementDto) {
    return this.svc.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
