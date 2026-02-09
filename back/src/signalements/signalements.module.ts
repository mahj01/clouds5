import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signalement } from './signalement.entity';
import { SignalementsService } from './signalements.service';
import { SignalementsController } from './signalements.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { TypeProbleme } from '../problemes/type-probleme.entity';
import { JournalModule } from '../journal/journal.module';
import { HistoriqueSignalementModule } from '../historique_signalement/historique-signalement.module';
import { FirestoreModule } from '../firestore/firestore.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Signalement,
      Utilisateur,
      Entreprise,
      TypeProbleme,
    ]),
    JournalModule,
    HistoriqueSignalementModule,
    FirestoreModule,
  ],
  providers: [SignalementsService],
  controllers: [SignalementsController],
  exports: [SignalementsService],
})
export class SignalementsModule {}
