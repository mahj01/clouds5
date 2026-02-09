import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('session')
export class Session {
  @PrimaryGeneratedColumn({ name: 'id_session' })
  id: number;

  @Column({ name: 'token', type: 'text' })
  token: string;

  @Column({
    name: 'date_creation',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dateCreation: Date;

  @Column({ name: 'date_expiration', type: 'timestamp' })
  dateExpiration: Date;

  @Column({ name: 'actif', type: 'boolean', default: true })
  actif: boolean;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: Utilisateur;
}
