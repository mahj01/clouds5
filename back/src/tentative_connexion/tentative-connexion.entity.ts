import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('tentative_connexion')
export class TentativeConnexion {
  @PrimaryGeneratedColumn({ name: 'id_tentative' })
  id: number;

  @Column({ name: 'date_tentative', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateTentative: Date;

  @Column({ name: 'succes', type: 'boolean' })
  succes: boolean;

  @Column({ name: 'ip', length: 45, nullable: true })
  ip?: string;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: Utilisateur;
}
