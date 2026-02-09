import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProblemesRoutiersService } from './problemes-routiers.service';
import { CreateProblemeRoutierDto } from './dto/create-probleme-routier.dto';
import { UpdateProblemeRoutierDto } from './dto/update-probleme-routier.dto';
import { StatutProbleme } from './probleme-routier.entity';

@ApiTags('problemes-routiers')
@ApiBearerAuth()
@Controller('problemes-routiers')
export class ProblemesRoutiersController {
  constructor(private readonly svc: ProblemesRoutiersService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les problèmes routiers' })
  @ApiResponse({ status: 200, description: 'Liste retournée.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('actifs')
  @ApiOperation({ summary: 'Liste uniquement les problèmes actifs' })
  findAllActifs() {
    return this.svc.findAllActifs();
  }

  @Get('statut/:statut')
  @ApiOperation({ summary: 'Liste les problèmes par statut' })
  findByStatut(@Param('statut') statut: StatutProbleme) {
    return this.svc.findByStatut(statut);
  }

  @Get('type/:typeId')
  @ApiOperation({ summary: 'Liste les problèmes par type' })
  findByType(@Param('typeId', ParseIntPipe) typeId: number) {
    return this.svc.findByType(typeId);
  }

  @Get('geojson')
  @ApiOperation({ summary: 'Retourne les problèmes au format GeoJSON' })
  @ApiQuery({ name: 'statut', required: false, enum: StatutProbleme })
  getGeoJSON(@Query('statut') statut?: StatutProbleme) {
    return this.svc.getGeoJSON(statut);
  }

  @Get('statistiques')
  @ApiOperation({ summary: 'Retourne les statistiques des problèmes' })
  getStatistiques() {
    return this.svc.getStatistiques();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupère un problème par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crée un nouveau problème routier' })
  @ApiResponse({ status: 201, description: 'Problème créé.' })
  create(@Body() dto: CreateProblemeRoutierDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Met à jour un problème routier' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProblemeRoutierDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Post(':id/resoudre')
  @ApiOperation({ summary: 'Marque un problème comme résolu' })
  resoudre(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { utilisateurResolutionId: number; commentaire?: string },
  ) {
    return this.svc.resoudre(
      id,
      body.utilisateurResolutionId,
      body.commentaire,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprime un problème routier' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
