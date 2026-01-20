import { IsBoolean, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTentativeConnexionDto {
  @ApiProperty({ example: true })
  @Type(() => Boolean)
  @IsBoolean()
  succes: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  utilisateurId: number;
}
