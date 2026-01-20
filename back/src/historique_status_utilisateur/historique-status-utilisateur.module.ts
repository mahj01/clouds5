import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriqueStatusUtilisateur } from './historique-status-utilisateur.entity';
import { HistoriqueStatusUtilisateurService } from './historique-status-utilisateur.service';
import { HistoriqueStatusUtilisateurController } from './historique-status-utilisateur.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriqueStatusUtilisateur, Utilisateur, StatutCompte])],
  providers: [HistoriqueStatusUtilisateurService],
  controllers: [HistoriqueStatusUtilisateurController],
})
export class HistoriqueStatusUtilisateurModule {}
