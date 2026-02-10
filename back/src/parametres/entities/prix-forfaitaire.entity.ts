import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('prix_forfaitaire')
export class PrixForfaitaire {
  @PrimaryGeneratedColumn({ name: 'id_prix_forfaitaire' })
  id: number;

  @Column({ name: 'libelle', length: 100 })
  libelle: string;

  @Column({ name: 'prix_m2', type: 'decimal', precision: 10, scale: 2 })
  prixM2: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'date_creation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'date_modification' })
  dateModification: Date;
}
