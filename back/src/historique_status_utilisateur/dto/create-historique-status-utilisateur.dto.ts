import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHistoriqueStatusUtilisateurDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  utilisateurId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  statutCompteId: number;
}
