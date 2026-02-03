import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ParametresController } from './parametres.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ParametresController],
})
export class ParametresModule {}
