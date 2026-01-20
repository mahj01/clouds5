import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('entreprise')
export class Entreprise {
  @PrimaryGeneratedColumn({ name: 'id_entreprise' })
  id: number;

  @Column({ name: 'nom', length: 100 })
  nom: string;

  @Column({ name: 'contact', length: 100, nullable: true })
  contact?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;
}
