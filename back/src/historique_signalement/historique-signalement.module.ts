import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriqueSignalement } from './historique-signalement.entity';
import { HistoriqueSignalementService } from './historique-signalement.service';
import { HistoriqueSignalementController } from './historique-signalement.controller';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoriqueSignalement, Signalement, Utilisateur]),
  ],
  providers: [HistoriqueSignalementService],
  controllers: [HistoriqueSignalementController],
  exports: [HistoriqueSignalementService],
})
export class HistoriqueSignalementModule {}
