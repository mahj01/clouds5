import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';

@Entity('validations')
export class Validation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  statut: string; // 'en_attente', 'valide', 'rejete', 'a_corriger'

  @Column({ type: 'text', nullable: true })
  commentaire?: string;

  @Column({ type: 'text', nullable: true })
  erreursDetectees?: string; // JSON des erreurs

  @Column({ type: 'boolean', default: false })
  coordonneesValides: boolean;

  @Column({ type: 'boolean', default: false })
  donneesCompletes: boolean;

  @Column({ type: 'boolean', default: false })
  coherenceDonnees: boolean;

  @CreateDateColumn({ name: 'date_validation' })
  dateValidation: Date;

  @ManyToOne(() => Signalement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'signalement_id' })
  signalement: Signalement;

  @ManyToOne(() => Utilisateur, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'valide_par' })
  validePar?: Utilisateur;
}
