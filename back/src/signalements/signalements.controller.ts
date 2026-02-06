import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SignalementsService } from './signalements.service';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { UpdateSignalementDto } from './dto/update-signalement.dto';

@ApiTags('signalements')
@ApiBearerAuth()
@Controller('signalements')
export class SignalementsController {
  constructor(private readonly svc: SignalementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all signalements' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('actifs')
  @ApiOperation({ summary: 'List active signalements' })
  findAllActifs() {
    return this.svc.findAllActifs();
  }

  @Get('statut/:statut')
  @ApiOperation({ summary: 'List signalements by status' })
  findByStatut(@Param('statut') statut: string) {
    return this.svc.findByStatut(statut);
  }

  @Get('type/:typeId')
  @ApiOperation({ summary: 'List signalements by type' })
  findByType(@Param('typeId', ParseIntPipe) typeId: number) {
    return this.svc.findByType(typeId);
  }

  @Get('geojson')
  @ApiOperation({ summary: 'Get signalements as GeoJSON' })
  @ApiQuery({ name: 'statut', required: false })
  getGeoJSON(@Query('statut') statut?: string) {
    return this.svc.getGeoJSON(statut);
  }

  @Get('statistiques')
  @ApiOperation({ summary: 'Get signalements statistics' })
  getStatistiques() {
    return this.svc.getStatistiques();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get signalement by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create signalement' })
  create(@Body() dto: CreateSignalementDto) {
    return this.svc.create(dto);
  }

  @Post(':id/resoudre')
  @ApiOperation({ summary: 'Resolve a signalement' })
  resoudre(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { utilisateurResolutionId: number; commentaire?: string },
  ) {
    return this.svc.resoudre(id, body.utilisateurResolutionId, body.commentaire);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update signalement' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSignalementDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete signalement' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
