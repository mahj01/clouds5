import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sauvegarde } from './sauvegarde.entity';
import { SauvegardeService } from './sauvegarde.service';
import { SauvegardeController } from './sauvegarde.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Entreprise } from '../entreprises/entreprise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sauvegarde,
      Utilisateur,
      Signalement,
      Entreprise,
    ]),
  ],
  controllers: [SauvegardeController],
  providers: [SauvegardeService],
  exports: [SauvegardeService],
})
export class SauvegardeModule {}
