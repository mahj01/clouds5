import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrixForfaitaireDto {
  @ApiProperty({
    example: 'Prix standard route',
    description: 'Libellé du prix forfaitaire',
  })
  @IsString()
  @MaxLength(100)
  libelle: string;

  @ApiProperty({
    example: 50000,
    description: 'Prix forfaitaire par mètre carré (MGA)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  prixM2: number;

  @ApiPropertyOptional({
    example: 'Prix forfaitaire pour la réparation de routes standards',
    description: 'Description détaillée du tarif',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
