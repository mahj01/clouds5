import { IsOptional, IsString, IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSignalementDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 48.8566 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 2.3522 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false, default: 'nouveau' })
  @IsOptional()
  @IsString()
  statut?: string;

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

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  utilisateurId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entrepriseId?: number;
}
