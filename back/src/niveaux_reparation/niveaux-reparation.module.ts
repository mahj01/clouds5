import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NiveauxReparationService } from './niveaux-reparation.service';
import { NiveauxReparationController } from './niveaux-reparation.controller';
import { NiveauReparation } from './niveau-reparation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NiveauReparation])],
  providers: [NiveauxReparationService],
  controllers: [NiveauxReparationController],
  exports: [NiveauxReparationService],
})
export class NiveauxReparationModule {}
