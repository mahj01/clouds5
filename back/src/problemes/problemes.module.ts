import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeProbleme } from './type-probleme.entity';
import { ProblemeRoutier } from './probleme-routier.entity';
import { TypesProblemesService } from './types-problemes.service';
import { TypesProblemesController } from './types-problemes.controller';
import { ProblemesRoutiersService } from './problemes-routiers.service';
import { ProblemesRoutiersController } from './problemes-routiers.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TypeProbleme, ProblemeRoutier, Utilisateur])],
  providers: [TypesProblemesService, ProblemesRoutiersService],
  controllers: [TypesProblemesController, ProblemesRoutiersController],
  exports: [TypesProblemesService, ProblemesRoutiersService],
})
export class ProblemesModule {}
