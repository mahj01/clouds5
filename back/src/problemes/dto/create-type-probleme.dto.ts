import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTypeProblemeDto {
  @ApiProperty({ example: 'Nid de poule' })
  @IsString()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ required: false, example: 'Trou dans la chaussée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'fa-circle-exclamation' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icone?: string;

  @ApiProperty({ required: false, default: '#FF5733' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  couleur?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
