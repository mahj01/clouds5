import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirebaseRegisterDto {
  @ApiProperty({ description: 'Firebase ID token' })
  @IsString()
  idToken: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prenom?: string;
}
