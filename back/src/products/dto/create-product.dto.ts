import { IsString, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Banana', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 9.99, description: 'Price in EUR' })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ example: 1, description: 'Category id' })
  @Type(() => Number)
  @IsInt()
  categoryId: number;
}
