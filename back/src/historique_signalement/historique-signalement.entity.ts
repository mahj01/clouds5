import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('historique_signalement')
@Index('IDX_hist_signalement_firebase_signalement_id', [
  'firebaseSignalementId',
])
export class HistoriqueSignalement {
  @PrimaryGeneratedColumn({ name: 'id_historique' })
  id: number;

  @Column({ name: 'ancien_statut', length: 20, nullable: true })
  ancienStatut?: string;

  @Column({ name: 'nouveau_statut', length: 20, nullable: true })
  nouveauStatut?: string;

  @Column({
    name: 'date_changement',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dateChangement: Date;

  /** Foreign key to Firestore signalement doc (not the SQL PK). */
  @Column({ name: 'firebase_signalement_id', length: 100, nullable: true })
  firebaseSignalementId?: string;

  /** UtilisateurUid of the creator of the signalement (from Firestore signalement doc). */
  @Column({ name: 'utilisateur_uid', length: 128, nullable: true })
  utilisateurUid?: string;

  @ManyToOne(() => Signalement, { nullable: false })
  @JoinColumn({ name: 'id_signalement' })
  signalement: Signalement;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_manager' })
  manager: Utilisateur;
}
