import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';


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
  create(@Body() dto: CreateUtilisateurDto) {
    return this.svc.create(dto);
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

}
