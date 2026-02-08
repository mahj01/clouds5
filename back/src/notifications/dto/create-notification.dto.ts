import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID de l\'utilisateur destinataire' })
  @IsNumber()
  utilisateurId!: number;

  @ApiProperty({ description: 'ID du signalement concerné (optionnel)', required: false })
  @IsOptional()
  @IsNumber()
  signalementId?: number;

  @ApiProperty({ description: 'Titre de la notification' })
  @IsString()
  titre!: string;

  @ApiProperty({ description: 'Message de la notification' })
  @IsString()
  message!: string;
}
