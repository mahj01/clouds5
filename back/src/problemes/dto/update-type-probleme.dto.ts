import { PartialType } from '@nestjs/swagger';
import { CreateTypeProblemeDto } from './create-type-probleme.dto';

export class UpdateTypeProblemeDto extends PartialType(CreateTypeProblemeDto) {}
