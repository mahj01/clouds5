import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly ds: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardSummary() {
    // Compter les entités principales
    const [
      totalUtilisateurs,
      totalSignalements,
      totalEntreprises,
      signalementStats,
      utilisateurStats,
      recentSignalements,
      recentActivites,
    ] = await Promise.all([
      this.ds.query('SELECT COUNT(*) as count FROM utilisateur'),
      this.ds.query('SELECT COUNT(*) as count FROM signalement'),
      this.ds.query('SELECT COUNT(*) as count FROM entreprise'),
      this.ds.query(`
        SELECT 
          statut,
          COUNT(*) as count,
          COALESCE(SUM(CAST(surface_m2 AS NUMERIC)), 0) as surface_total,
          COALESCE(SUM(CAST(budget AS NUMERIC)), 0) as budget_total
        FROM signalement
        GROUP BY statut
      `),
      this.ds.query(`
        SELECT 
          r.nom as role,
          COUNT(u.id_utilisateur) as count
        FROM utilisateur u
        LEFT JOIN role r ON r.id_role = u.id_role
        GROUP BY r.nom
      `),
      this.ds.query(`
        SELECT 
          s.id_signalement as id,
          s.titre,
          s.statut,
          s.date_signalement as "dateSignalement",
          s.avancement,
          u.nom || ' ' || u.prenom as "creePar"
        FROM signalement s
        LEFT JOIN utilisateur u ON u.id_utilisateur = s.id_utilisateur
        ORDER BY s.date_signalement DESC
        LIMIT 5
      `),
      this.ds.query(`
        SELECT 
          j.action,
          j.ressource,
          j.niveau,
          j.date_action as "dateAction",
          u.nom || ' ' || u.prenom as "utilisateur"
        FROM journal_acces j
        LEFT JOIN utilisateur u ON u.id_utilisateur = j.utilisateur_id
        ORDER BY j.date_action DESC
        LIMIT 5
      `),
    ]);

    // Calculer les stats par statut
    const parStatut = {
      actif: 0,
      en_cours: 0,
      resolu: 0,
      rejete: 0,
    };
    let surfaceTotal = 0;
    let budgetTotal = 0;

    for (const row of signalementStats) {
      const s = String(row.statut || '').toLowerCase();
      const count = Number(row.count) || 0;
      if (s === 'actif' || s === 'nouveau') parStatut.actif += count;
      else if (s === 'en_cours') parStatut.en_cours += count;
      else if (s === 'resolu' || s === 'terminé') parStatut.resolu += count;
      else if (s === 'rejete') parStatut.rejete += count;
      surfaceTotal += Number(row.surface_total) || 0;
      budgetTotal += Number(row.budget_total) || 0;
    }

    // Utilisateurs par rôle
    const parRole: Record<string, number> = {};
    for (const row of utilisateurStats) {
      parRole[row.role || 'sans_role'] = Number(row.count) || 0;
    }

    // Avancement global
    const total = Number(totalSignalements[0]?.count) || 0;
    const avancementGlobal = total > 0 
      ? Math.round(((parStatut.resolu * 100) + (parStatut.en_cours * 50)) / total) 
      : 0;

    return {
      totaux: {
        utilisateurs: Number(totalUtilisateurs[0]?.count) || 0,
        signalements: total,
        entreprises: Number(totalEntreprises[0]?.count) || 0,
      },
      signalements: {
        parStatut,
        surfaceTotal,
        budgetTotal,
        avancementGlobal,
      },
      utilisateurs: {
        parRole,
      },
      recentSignalements: recentSignalements || [],
      recentActivites: recentActivites || [],
    };
  }
}
