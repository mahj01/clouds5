import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateJournalDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  ressource?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'error'])
  niveau?: string;

  @IsOptional()
  @IsNumber()
  utilisateurId?: number;
}
