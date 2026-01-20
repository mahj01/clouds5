import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';

@ApiTags('utilisateurs')
@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly svc: UtilisateursService) {}

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
}
