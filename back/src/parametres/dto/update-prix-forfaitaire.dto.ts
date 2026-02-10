import { PartialType } from '@nestjs/swagger';
import { CreatePrixForfaitaireDto } from './create-prix-forfaitaire.dto';

export class UpdatePrixForfaitaireDto extends PartialType(
  CreatePrixForfaitaireDto,
) {}
