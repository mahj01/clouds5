import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

export enum FirestoreSyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
}

@Entity('historique_signalement')
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

  // --- Firestore diff sync (outbox) ---
  @Column({
    name: 'firestore_sync_status',
    type: 'varchar',
    length: 20,
    default: FirestoreSyncStatus.PENDING,
  })
  firestoreSyncStatus: FirestoreSyncStatus;

  @Column({ name: 'firestore_synced_at', type: 'timestamp', nullable: true })
  firestoreSyncedAt?: Date;

  @Column({ name: 'firestore_error', type: 'text', nullable: true })
  firestoreError?: string;

  @Column({ name: 'firestore_attempts', type: 'int', default: 0 })
  firestoreAttempts: number;

  @ManyToOne(() => Signalement, { nullable: false })
  @JoinColumn({ name: 'id_signalement' })
  signalement: Signalement;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_manager' })
  manager: Utilisateur;
}
