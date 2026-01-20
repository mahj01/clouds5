import { IsString, IsBoolean, IsInt, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ example: 'JWT-TOKEN' })
  @IsString()
  token: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  dateExpiration: Date;

  @ApiProperty({ required: false, default: true })
  @Type(() => Boolean)
  @IsBoolean()
  actif?: boolean;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  utilisateurId: number;
}
