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
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NiveauxReparationService } from './niveaux-reparation.service';
import { CreateNiveauReparationDto } from './dto/create-niveau-reparation.dto';
import { UpdateNiveauReparationDto } from './dto/update-niveau-reparation.dto';

@ApiTags('niveaux-reparation')
@ApiBearerAuth()
@Controller('niveaux-reparation')
export class NiveauxReparationController {
  constructor(private readonly svc: NiveauxReparationService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les niveaux de réparation' })
  @ApiResponse({ status: 200, description: 'Liste des niveaux retournée.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un niveau de réparation par ID' })
  @ApiResponse({ status: 200, description: 'Niveau trouvé.' })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Get('niveau/:niveau')
  @ApiOperation({ summary: 'Récupérer un niveau de réparation par sa valeur (1-10)' })
  @ApiResponse({ status: 200, description: 'Niveau trouvé.' })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé.' })
  findByNiveau(@Param('niveau', ParseIntPipe) niveau: number) {
    return this.svc.findByNiveau(niveau);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau niveau de réparation' })
  @ApiResponse({ status: 201, description: 'Niveau créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Niveau déjà existant.' })
  create(@Body() dto: CreateNiveauReparationDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un niveau de réparation' })
  @ApiResponse({ status: 200, description: 'Niveau mis à jour.' })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNiveauReparationDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un niveau de réparation' })
  @ApiResponse({ status: 200, description: 'Niveau supprimé.' })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
