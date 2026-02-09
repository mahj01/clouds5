import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('sauvegardes')
export class Sauvegarde {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // 'signalements', 'problemes', 'entreprises', 'complete'

  @Column({ type: 'varchar', length: 50, default: 'en_cours' })
  statut: string; // 'en_cours', 'termine', 'erreur'

  @Column({ type: 'text', nullable: true })
  cheminFichier: string;

  @Column({ type: 'bigint', nullable: true })
  tailleFichier: number; // en bytes

  @Column({ type: 'int', default: 0 })
  nombreElements: number;

  @Column({ type: 'text', nullable: true })
  erreur: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON avec infos supplémentaires

  @CreateDateColumn({ name: 'date_creation' })
  dateCreation: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'date_fin' })
  dateFin: Date;

  @ManyToOne(() => Utilisateur, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cree_par' })
  creePar: Utilisateur;
}
