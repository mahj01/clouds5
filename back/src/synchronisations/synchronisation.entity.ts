import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('synchronisation')
export class Synchronisation {
  @PrimaryGeneratedColumn({ name: 'id_sync' })
  id: number;

  @Column({ name: 'type_sync', length: 30 })
  typeSync: string;

  @Column({ name: 'date_sync', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateSync: Date;

  @Column({ name: 'statut', length: 20 })
  statut: string;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_manager' })
  manager: Utilisateur;
}
