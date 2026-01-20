import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUtilisateurDto, @Headers('x-manager-email') managerEmail?: string, @Headers('x-manager-password') managerPassword?: string) {
    return this.svc.create(dto, managerEmail, managerPassword);
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
