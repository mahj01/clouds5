import { PartialType } from '@nestjs/swagger';
import { CreateNiveauReparationDto } from './create-niveau-reparation.dto';

export class UpdateNiveauReparationDto extends PartialType(
  CreateNiveauReparationDto,
) {}
