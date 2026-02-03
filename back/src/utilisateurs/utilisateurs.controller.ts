import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Headers, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';

@ApiTags('utilisateurs')
@ApiBearerAuth()
@Controller('utilisateurs')
export class UtilisateursController {
  // Injection des deux services dans le même constructeur
  constructor(
    private readonly svc: UtilisateursService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List utilisateurs' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('locked')
  @ApiTags('deblocage')
  @ApiOperation({ summary: 'Lister les comptes bloqués (manager uniquement)' })
  @ApiOkResponse({ description: 'Liste des comptes bloqués.' })
  @ApiUnauthorizedResponse({ description: 'Token de session manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Accès refusé (réservé au rôle manager).' })
  listLocked(@Req() req: any) {
    return this.svc.listLockedUsers(req?.user?.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post('unlock/:id')
  @ApiTags('deblocage')
  @ApiOperation({ summary: 'Débloquer un compte utilisateur (manager uniquement)' })
  @ApiParam({ name: 'id', description: 'ID utilisateur à débloquer', type: Number })
  @ApiOkResponse({ description: 'Compte débloqué, tentatives réinitialisées.' })
  @ApiUnauthorizedResponse({ description: 'Token de session manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Accès refusé (réservé au rôle manager).' })
  unlock(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.unlockUser(id, req?.user?.id);
  }

  @Post('lock/:id')
  @ApiTags('blocage')
  @ApiOperation({ summary: 'Bloquer un compte utilisateur (manager uniquement)' })
  @ApiParam({ name: 'id', description: 'ID utilisateur à bloquer', type: Number })
  @ApiOkResponse({ description: 'Compte bloqué.' })
  @ApiUnauthorizedResponse({ description: 'Token de session manquant ou invalide.' })
  @ApiForbiddenResponse({ description: 'Accès refusé (réservé au rôle manager).' })
  lock(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.lockUser(id, req?.user?.id);
  }

  @Post()
  create(@Body() dto: CreateUtilisateurDto, @Req() req: any) {
    return this.svc.create(dto, req?.user?.id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUtilisateurDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Get('email/:me')
  findByEmail(@Param('me') email: string) {
    return this.svc.findOneByEmail(email);
  }

  @Post('register')
  @ApiOperation({ summary: 'Inscrire un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() dto: CreateUtilisateurDto) {
    return this.svc.register(dto);
  }
}
