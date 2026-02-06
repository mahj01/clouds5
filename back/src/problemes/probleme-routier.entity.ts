import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { TypeProbleme } from './type-probleme.entity';
import type { Signalement } from '../signalements/signalement.entity';

export enum StatutProbleme {
  ACTIF = 'actif',
  EN_COURS = 'en_cours',
  RESOLU = 'resolu',
  REJETE = 'rejete',
}

@Entity('probleme_routier')
export class ProblemeRoutier {
  @PrimaryGeneratedColumn({ name: 'id_probleme' })
  id: number;

  @Column({ name: 'titre', length: 150 })
  titre: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7 })
  latitude: string;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7 })
  longitude: string;

  @Column({ name: 'adresse', length: 255, nullable: true })
  adresse?: string;

  @Column({
    name: 'statut',
    type: 'enum',
    enum: StatutProbleme,
    default: StatutProbleme.ACTIF,
  })
  statut: StatutProbleme;

  @Column({ name: 'priorite', type: 'int', default: 1 })
  priorite: number;

  @Column({ name: 'date_signalement', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateSignalement: Date;

  @Column({ name: 'date_resolution', type: 'timestamp', nullable: true })
  dateResolution?: Date;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl?: string;

  @Column({ name: 'commentaire_resolution', type: 'text', nullable: true })
  commentaireResolution?: string;

  @ManyToOne(() => TypeProbleme, (t) => t.problemes, { nullable: false })
  @JoinColumn({ name: 'id_type_probleme' })
  typeProbleme: TypeProbleme;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur_signaleur' })
  utilisateurSignaleur: Utilisateur;

  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'id_utilisateur_resolution' })
  utilisateurResolution?: Utilisateur;

  // Relation avec Signalement - chaque problème routier est lié à un signalement
  @OneToOne('Signalement', 'problemeRoutier', { nullable: true, cascade: true })
  @JoinColumn({ name: 'id_signalement' })
  signalement?: Signalement;
}
