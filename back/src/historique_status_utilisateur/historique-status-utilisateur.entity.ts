import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { StatutCompte } from '../statut_compte/statut-compte.entity';

@Entity('historique_status_utilisateur')
export class HistoriqueStatusUtilisateur {
  @PrimaryGeneratedColumn({ name: 'id_historique_status_utilisateur' })
  id: number;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: Utilisateur;

  @ManyToOne(() => StatutCompte, { nullable: false })
  @JoinColumn({ name: 'id_statut_compte' })
  statut: StatutCompte;
}
