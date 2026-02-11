import { Module } from '@nestjs/common';
import { FirestoreSyncService } from './firestore-sync.service';
import { FirestoreController } from './firestore.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/role.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Session } from '../sessions/session.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';
import { HistoriqueSignalement } from '../historique_signalement/historique-signalement.entity';
import { FirestoreDiffSyncService } from './firestore-diff-sync.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Utilisateur,
      Entreprise,
      Signalement,
      Session,
      StatutCompte,
      HistoriqueSignalement,
    ]),
    NotificationsModule,
  ],
  providers: [FirestoreSyncService, FirestoreDiffSyncService],
  controllers: [FirestoreController],
  exports: [FirestoreSyncService, FirestoreDiffSyncService],
})
export class FirestoreModule {}
