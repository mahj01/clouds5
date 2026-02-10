import { IsOptional, IsString, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSignalementDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiProperty({ required: false })
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
  @IsString()
  commentaireResolution?: string;

  @ApiProperty({
    required: false,
    description:
      'Avancement auto-calculé (0, 50, 100). Ignoré si fourni, calculé depuis le statut.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  avancement?: number;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeProblemeId?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  utilisateurId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  utilisateurResolutionId?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entrepriseId?: number | null;
}
