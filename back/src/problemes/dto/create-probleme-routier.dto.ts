import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatutProbleme } from '../probleme-routier.entity';

export class CreateProblemeRoutierDto {
  @ApiProperty({ example: 'Nid de poule avenue de la Liberté' })
  @IsString()
  @MaxLength(150)
  titre: string;

  @ApiProperty({
    required: false,
    example: 'Grand trou au niveau du carrefour',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: -18.8792 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 47.5079 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiProperty({
    required: false,
    example: 'Avenue de la Liberté, Antananarivo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @ApiProperty({
    required: false,
    enum: StatutProbleme,
    default: StatutProbleme.ACTIF,
  })
  @IsOptional()
  @IsEnum(StatutProbleme)
  statut?: StatutProbleme;

  @ApiProperty({ required: false, default: 1, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priorite?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  typeProblemeId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  utilisateurSignaleurId: number;
}
