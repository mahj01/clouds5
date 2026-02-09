import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { SauvegardeService } from './sauvegarde.service';
import { CreateSauvegardeDto } from './dto/create-sauvegarde.dto';

@Controller('sauvegarde')
export class SauvegardeController {
  constructor(private readonly sauvegardeService: SauvegardeService) {}

  @Post()
  create(@Body() dto: CreateSauvegardeDto) {
    return this.sauvegardeService.create(dto);
  }

  @Get()
  findAll() {
    return this.sauvegardeService.findAll();
  }

  @Get('statistiques')
  getStatistiques() {
    return this.sauvegardeService.getStatistiques();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sauvegardeService.findOne(id);
  }

  @Get(':id/telecharger')
  async telecharger(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { filePath, fileName } = await this.sauvegardeService.telecharger(id);
    res.download(filePath, fileName);
  }

  @Delete(':id')
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.sauvegardeService.supprimer(id);
    return { message: 'Sauvegarde supprimée' };
  }
}
