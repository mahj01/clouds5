import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterJournalDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  ressource?: string;

  @IsOptional()
  @IsString()
  niveau?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  utilisateurId?: number;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number;
}
