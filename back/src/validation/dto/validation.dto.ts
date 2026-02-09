import {
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class CreateValidationDto {
  @IsNumber()
  signalementId: number;

  @IsIn(['en_attente', 'valide', 'rejete', 'a_corriger'])
  statut: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsNumber()
  validePar?: number;
}

export class ValiderSignalementDto {
  @IsIn(['valide', 'rejete', 'a_corriger'])
  statut: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsNumber()
  validePar?: number;
}

export class ValidationAutoDto {
  @IsOptional()
  @IsBoolean()
  validerTous?: boolean;
}
