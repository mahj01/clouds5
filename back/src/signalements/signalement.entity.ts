import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { HistoriqueSignalement } from '../historique_signalement/historique-signalement.entity';
import { TypeProbleme } from '../problemes/type-probleme.entity';

export enum StatutSignalement {
  ACTIF = 'actif',
  EN_COURS = 'en_cours',
  RESOLU = 'resolu',
  REJETE = 'rejete',
}

/** Retourne le pourcentage d'avancement selon le statut */
export function avancementFromStatut(statut: string): number {
  const map: Record<string, number> = {
    [StatutSignalement.EN_COURS]: 50,
    [StatutSignalement.RESOLU]: 100,
    [StatutSignalement.ACTIF]: 0,
    [StatutSignalement.REJETE]: 0,
  };

  return map[statut] ?? 0;
}

@Entity('signalement')
export class Signalement {
  @PrimaryGeneratedColumn({ name: 'id_signalement' })
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
    name: 'date_signalement',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dateSignalement: Date;

  @Column({
    name: 'statut',
    type: 'varchar',
    length: 20,
    default: StatutSignalement.ACTIF,
  })
  statut: string;

  @Column({ name: 'priorite', type: 'int', default: 1 })
  priorite: number;

  @Column({ name: 'date_resolution', type: 'timestamp', nullable: true })
  dateResolution?: Date;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl?: string;

  @Column({ name: 'commentaire_resolution', type: 'text', nullable: true })
  commentaireResolution?: string;

  @Column({
    name: 'surface_m2',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  surfaceM2?: string;

  @Column({
    name: 'budget',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  budget?: string;

  @Column({ name: 'avancement', type: 'int', default: 0 })
  avancement: number;

  /**
   * Firestore document id of the mobile-created signalement (when imported from Firebase).
   * Used to update the canonical mobile doc and avoid updating multiple docs by pg_id.
   */
  @Column({
    name: 'firestore_doc_id',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  firestoreDocId?: string;

  // Type de problème (relation avec TypeProbleme)
  @ManyToOne(() => TypeProbleme, { nullable: true })
  @JoinColumn({ name: 'id_type_probleme' })
  typeProbleme?: TypeProbleme;

  // Utilisateur qui a signalé
  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: Utilisateur;

  // Utilisateur qui a résolu
  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'id_utilisateur_resolution' })
  utilisateurResolution?: Utilisateur;

  @ManyToOne(() => Entreprise, { nullable: true })
  @JoinColumn({ name: 'id_entreprise' })
  entreprise?: Entreprise;

  @OneToMany(() => HistoriqueSignalement, (h) => h.signalement)
  historiques: HistoriqueSignalement[];

  
}
