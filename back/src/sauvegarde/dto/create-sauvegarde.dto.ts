import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';

export class CreateSauvegardeDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsIn(['signalements', 'problemes', 'entreprises', 'complete'])
  type: string;

  @IsOptional()
  @IsNumber()
  utilisateurId?: number;
}
