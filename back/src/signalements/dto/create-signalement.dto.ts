import { IsOptional, IsString, IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSignalementDto {
  @ApiProperty({ example: 'Nid de poule dangereux' })
  @IsString()
  titre: string;

  @ApiProperty({ required: false })
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ required: false, default: 'actif' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priorite?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  surfaceM2?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;

  @ApiProperty({ example: 1, description: 'ID du type de problème' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeProblemeId?: number;

  @ApiProperty({ example: 1, description: "ID de l'utilisateur qui signale" })
  @Type(() => Number)
  @IsInt()
  utilisateurId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entrepriseId?: number;
}
