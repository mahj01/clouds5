import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';
import { HistoriqueSignalement } from '../historique_signalement/historique-signalement.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum NotificationType {
  SIGNALEMENT_STATUS_CHANGED = 'signalement_status_changed',
}

@Entity('notification_outbox')
@Index(['utilisateur', 'status'])
@Index(['status', 'nextAttemptAt'])
@Index(['historiqueSignalement'], { unique: true })
export class NotificationOutbox {
  @PrimaryGeneratedColumn({ name: 'id_notification' })
  id: number;

  @Column({
    name: 'type',
    type: 'varchar',
    length: 100,
    default: NotificationType.SIGNALEMENT_STATUS_CHANGED,
  })
  type: NotificationType;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ name: 'title', type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'body', type: 'text' })
  body: string;

  /** Optional extra fields for the mobile client */
  @Column({ name: 'data', type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'next_attempt_at', type: 'timestamp', nullable: true })
  nextAttemptAt?: Date;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string;

  // --- Relations ---
  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: Utilisateur;

  @ManyToOne(() => Signalement, { nullable: false })
  @JoinColumn({ name: 'id_signalement' })
  signalement: Signalement;

  /**
   * If the notification is generated from a HistoriqueSignalement row, link it.
   * Unique index makes it idempotent (1 notif per historique).
   */
  @ManyToOne(() => HistoriqueSignalement, { nullable: true })
  @JoinColumn({ name: 'id_historique_signalement' })
  historiqueSignalement?: HistoriqueSignalement;
}
