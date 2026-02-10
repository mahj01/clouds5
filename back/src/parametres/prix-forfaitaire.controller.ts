import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PrixForfaitaireService } from './prix-forfaitaire.service';
import { CreatePrixForfaitaireDto } from './dto/create-prix-forfaitaire.dto';
import { UpdatePrixForfaitaireDto } from './dto/update-prix-forfaitaire.dto';
import { PrixForfaitaire } from './entities/prix-forfaitaire.entity';

@ApiTags('prix-forfaitaire')
@ApiBearerAuth()
@Controller('prix-forfaitaire')
export class PrixForfaitaireController {
  constructor(private readonly service: PrixForfaitaireService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau prix forfaitaire par m²' })
  @ApiCreatedResponse({
    description: 'Prix forfaitaire créé avec succès',
    type: PrixForfaitaire,
  })
  create(@Body() dto: CreatePrixForfaitaireDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste de tous les prix forfaitaires' })
  @ApiOkResponse({
    description: 'Liste des prix forfaitaires',
    type: [PrixForfaitaire],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un prix forfaitaire par son ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PrixForfaitaire })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un prix forfaitaire' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PrixForfaitaire })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrixForfaitaireDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un prix forfaitaire' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Prix forfaitaire supprimé' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
