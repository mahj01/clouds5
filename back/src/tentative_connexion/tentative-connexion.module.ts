import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TentativeConnexion } from './tentative-connexion.entity';
import { TentativeConnexionService } from './tentative-connexion.service';
import { TentativeConnexionController } from './tentative-connexion.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TentativeConnexion, Utilisateur])],
  providers: [TentativeConnexionService],
  controllers: [TentativeConnexionController],
})
export class TentativeConnexionModule {}
