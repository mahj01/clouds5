import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'id_notification' })
  id!: number;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur!: Utilisateur;

  @ManyToOne(() => Signalement, { nullable: true })
  @JoinColumn({ name: 'id_signalement' })
  signalement?: Signalement;

  @Column({ name: 'titre', type: 'varchar', length: 255 })
  titre!: string;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({ name: 'lu', type: 'boolean', default: false })
  lu!: boolean;

  @Column({ name: 'envoye', type: 'boolean', default: false })
  envoye!: boolean;

  @CreateDateColumn({ name: 'date_creation' })
  dateCreation!: Date;
}
