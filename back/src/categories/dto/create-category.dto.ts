import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCategoryDto {
  @ApiProperty({ example: 'Fruits', description: 'Category name' })
  @IsString()
  name: string;
}
