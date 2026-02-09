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
import { HistoriqueStatusUtilisateurService } from './historique-status-utilisateur.service';
import { CreateHistoriqueStatusUtilisateurDto } from './dto/create-historique-status-utilisateur.dto';
import { UpdateHistoriqueStatusUtilisateurDto } from './dto/update-historique-status-utilisateur.dto';

@ApiTags('historique-status-utilisateur')
@ApiBearerAuth()
@Controller('historique-status-utilisateur')
export class HistoriqueStatusUtilisateurController {
  constructor(private readonly svc: HistoriqueStatusUtilisateurService) {}

  @Get()
  @ApiOperation({ summary: 'List historique status utilisateur entries' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateHistoriqueStatusUtilisateurDto) {
    return this.svc.create(dto);
  }
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHistoriqueStatusUtilisateurDto,
  ) {
    return this.svc.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
