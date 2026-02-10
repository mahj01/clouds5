import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNiveauReparationDto {
  @ApiProperty({ example: 5, description: 'Niveau de réparation (1 à 10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  niveau: number;

  @ApiProperty({ example: 'Moyen', description: 'Libellé du niveau' })
  @IsString()
  libelle: string;

  @ApiPropertyOptional({
    example: 'Réparation de difficulté moyenne',
    description: 'Description détaillée du niveau',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '#FFA500',
    description: 'Couleur associée au niveau (code hexadécimal)',
  })
  @IsOptional()
  @IsString()
  couleur?: string;
}
