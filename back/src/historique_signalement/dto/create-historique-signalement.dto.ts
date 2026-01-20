import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHistoriqueSignalementDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ancienStatut?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nouveauStatut?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  signalementId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  managerId: number;
}
