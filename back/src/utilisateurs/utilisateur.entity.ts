import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';

@Entity('utilisateur')
export class Utilisateur {
  @PrimaryGeneratedColumn({ name: 'id_utilisateur' })
  id: number;

  @Column({ name: 'email', length: 100, unique: true })
  email: string;

  @Column({ name: 'mot_de_passe', type: 'text' })
  motDePasse: string;

  @Column({ name: 'nom', length: 50, nullable: true })
  nom?: string;

  @Column({ name: 'prenom', length: 50, nullable: true })
  prenom?: string;

  @ManyToOne(() => Role, (r) => r.utilisateurs, { nullable: true })
  @JoinColumn({ name: 'id_role' })
  role?: Role;

  // Nombre de tentatives restantes avant blocage (3 au départ)
  @Column({ name: 'nb_tentatives', type: 'int', default: 3 })
  nbTentatives: number;

  @Column({ name: 'date_blocage', type: 'timestamp', nullable: true })
  dateBlocage?: Date | null;

  @Column({
    name: 'date_creation',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dateCreation: Date;

  // Firebase UID - null si pas encore synchronisé avec Firebase
  @Column({
    name: 'firebase_uid',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  firebaseUid?: string | null;
}
