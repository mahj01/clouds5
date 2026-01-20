import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSynchronisationDto {
  @ApiProperty({ example: 'firebase_to_local' })
  @IsString()
  typeSync: string;

  @ApiProperty({ example: 'succes' })
  @IsString()
  statut: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  managerId: number;
}
