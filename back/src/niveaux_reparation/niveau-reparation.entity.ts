import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('niveau_reparation')
export class NiveauReparation {
  @PrimaryGeneratedColumn({ name: 'id_niveau_reparation' })
  id: number;

  @Column({ name: 'niveau', type: 'int' })
  niveau: number;

  @Column({ name: 'libelle', length: 100 })
  libelle: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'couleur', length: 20, nullable: true })
  couleur?: string;
}
