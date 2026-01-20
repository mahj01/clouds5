import { IsEmail, IsOptional, IsString, MinLength, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassw0rd!'})
  @IsString()
  motDePasse: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({ example: 1, description: 'Role ID'})
  @Type(() => Number)
  @IsInt()
  idRole: number;
}
