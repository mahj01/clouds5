import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('historique_signalement')
export class HistoriqueSignalement {
  @PrimaryGeneratedColumn({ name: 'id_historique' })
  id: number;

  @Column({ name: 'ancien_statut', length: 20, nullable: true })
  ancienStatut?: string;

  @Column({ name: 'nouveau_statut', length: 20, nullable: true })
  nouveauStatut?: string;

  @Column({ name: 'date_changement', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateChangement: Date;

  @ManyToOne(() => Signalement, { nullable: false })
  @JoinColumn({ name: 'id_signalement' })
  signalement: Signalement;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_manager' })
  manager: Utilisateur;
}
