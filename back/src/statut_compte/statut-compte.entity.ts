import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HistoriqueStatusUtilisateur } from '../historique_status_utilisateur/historique-status-utilisateur.entity';

@Entity('statut_compte')
export class StatutCompte {
  @PrimaryGeneratedColumn({ name: 'id_statut_compte' })
  id: number;

  @Column({ name: 'statut', length: 20 })
  statut: string;

  @OneToMany(() => HistoriqueStatusUtilisateur, (h) => h.statut)
  historiques: HistoriqueStatusUtilisateur[];
}
