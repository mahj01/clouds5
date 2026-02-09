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
import { HistoriqueStatusUtilisateur } from '../historique_status_utilisateur/historique-status-utilisateur.entity';
import { TypeProbleme } from '../problemes/type-probleme.entity';
import { Validation } from '../validation/validation.entity';
import { JournalAcces } from '../journal/journal.entity';
import { TentativeConnexion } from '../tentative_connexion/tentative-connexion.entity';
import { Synchronisation } from '../synchronisations/synchronisation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Role, Utilisateur, Entreprise, Signalement, Session, StatutCompte,
    HistoriqueSignalement, HistoriqueStatusUtilisateur, TypeProbleme,
    Validation, JournalAcces, TentativeConnexion, Synchronisation,
  ])],
  providers: [FirestoreSyncService],
  controllers: [FirestoreController],
  exports: [FirestoreSyncService],
})
export class FirestoreModule {}
