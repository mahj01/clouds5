import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutCompte } from './statut-compte.entity';
import { StatutCompteService } from './statut-compte.service';
import { StatutCompteController } from './statut-compte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutCompte])],
  providers: [StatutCompteService],
  controllers: [StatutCompteController],
})
export class StatutCompteModule {}
