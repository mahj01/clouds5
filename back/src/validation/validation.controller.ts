import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ValidationService, ValidationResult } from './validation.service';
import { ValiderSignalementDto } from './dto/validation.dto';

@Controller('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get()
  findAll() {
    return this.validationService.findAll();
  }

  @Get('statistiques')
  getStatistiques() {
    return this.validationService.getStatistiques();
  }

  @Get('non-valides')
  getSignalementsNonValides() {
    return this.validationService.getSignalementsNonValides();
  }

  @Get('statut/:statut')
  findByStatut(@Param('statut') statut: string) {
    return this.validationService.findByStatut(statut);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.validationService.findOne(id);
  }

  @Post('auto/:signalementId')
  validerAuto(
    @Param('signalementId', ParseIntPipe) signalementId: number,
  ): Promise<{
    signalementId: number;
    resultat: ValidationResult;
    statutSuggere: string;
  }> {
    return this.validationService.validerAuto(signalementId);
  }

  @Post('auto-tous')
  validerTousAuto() {
    return this.validationService.validerTousAuto();
  }

  @Post(':signalementId')
  validerSignalement(
    @Param('signalementId', ParseIntPipe) signalementId: number,
    @Body() dto: ValiderSignalementDto,
  ) {
    return this.validationService.validerSignalement(signalementId, dto);
  }
}
