import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn({ name: 'id_role' })
  id: number;

  @Column({ name: 'nom', length: 50 })
  nom: string;

  @OneToMany(() => Utilisateur, (u) => u.role)
  utilisateurs: Utilisateur[];
}
