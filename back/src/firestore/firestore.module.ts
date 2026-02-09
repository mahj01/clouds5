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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Utilisateur,
      Entreprise,
      Signalement,
      HistoriqueSignalement,
      Session,
      StatutCompte,
    ]),
  ],
  providers: [FirestoreSyncService],
  controllers: [FirestoreController],
  exports: [FirestoreSyncService],
})
export class FirestoreModule {}
