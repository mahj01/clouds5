-- ============================================================
-- Migration : Ajout colonne avancement au signalement
-- Date      : 2026-02-08
-- Logique   : actif=0%, en_cours=50%, resolu=100%, rejete=0%
-- ============================================================

-- 1. Ajouter la colonne avancement (défaut 0)
ALTER TABLE signalement
ADD COLUMN IF NOT EXISTS avancement INT NOT NULL DEFAULT 0;

-- 2. Mettre à jour les données existantes selon le statut actuel
UPDATE signalement SET avancement = 0   WHERE statut = 'actif';
UPDATE signalement SET avancement = 50  WHERE statut = 'en_cours';
UPDATE signalement SET avancement = 100 WHERE statut = 'resolu';
UPDATE signalement SET avancement = 0   WHERE statut = 'rejete';

-- Vérification
SELECT statut, avancement, COUNT(*) AS total
FROM signalement
GROUP BY statut, avancement
ORDER BY avancement;
