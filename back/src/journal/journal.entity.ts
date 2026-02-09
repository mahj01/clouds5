import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('journal_acces')
export class JournalAcces {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  action: string; // 'LOGIN', 'LOGOUT', 'ACCESS_PAGE', 'CREATE', 'UPDATE', 'DELETE', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  ressource: string; // ex: 'signalements', 'utilisateurs', '/dashboard', etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  details: string; // JSON ou texte libre pour infos supplémentaires

  @Column({ type: 'varchar', length: 20, default: 'info' })
  niveau: string; // 'info', 'warning', 'error'

  @CreateDateColumn({ name: 'date_action' })
  dateAction: Date;

  @ManyToOne(() => Utilisateur, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: Utilisateur;
}
