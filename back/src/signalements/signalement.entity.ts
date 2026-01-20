import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { HistoriqueSignalement } from '../historique_signalement/historique-signalement.entity';

@Entity('signalement')
export class Signalement {
  @PrimaryGeneratedColumn({ name: 'id_signalement' })
  id: number;

  @Column({ name: 'titre', length: 100, nullable: true })
  titre?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 9, scale: 6 })
  latitude: string;

  @Column({ name: 'longitude', type: 'decimal', precision: 9, scale: 6 })
  longitude: string;

  @Column({ name: 'date_signalement', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateSignalement: Date;

  @Column({ name: 'statut', length: 20, default: 'nouveau' })
  statut: string;

  @Column({ name: 'surface_m2', type: 'decimal', precision: 10, scale: 2, nullable: true })
  surfaceM2?: string;

  @Column({ name: 'budget', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget?: string;

  @ManyToOne(() => Utilisateur, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: Utilisateur;

  @ManyToOne(() => Entreprise, { nullable: true })
  @JoinColumn({ name: 'id_entreprise' })
  entreprise?: Entreprise;

  @OneToMany(() => HistoriqueSignalement, (h) => h.signalement)
  historiques: HistoriqueSignalement[];
}
