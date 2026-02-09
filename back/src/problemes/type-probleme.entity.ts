import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProblemeRoutier } from './probleme-routier.entity';

@Entity('type_probleme')
export class TypeProbleme {
  @PrimaryGeneratedColumn({ name: 'id_type_probleme' })
  id: number;

  @Column({ name: 'nom', length: 100 })
  nom: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'icone', length: 50, nullable: true })
  icone?: string;

  @Column({ name: 'couleur', length: 20, default: '#FF5733' })
  couleur: string;

  @Column({ name: 'actif', default: true })
  actif: boolean;

  @Column({
    name: 'date_creation',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dateCreation: Date;

  @OneToMany(() => ProblemeRoutier, (p) => p.typeProbleme)
  problemes: ProblemeRoutier[];
}
