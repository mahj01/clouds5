-- =====================================================
-- Script de migration: Lier les problèmes routiers existants aux signalements
-- Base de données: PostgreSQL
-- =====================================================

-- Ajouter la colonne id_signalement à la table probleme_routier si elle n'existe pas
ALTER TABLE probleme_routier 
ADD COLUMN IF NOT EXISTS id_signalement INTEGER REFERENCES signalement(id_signalement);

-- Créer les signalements pour chaque problème routier existant qui n'a pas encore de signalement
INSERT INTO signalement (titre, description, latitude, longitude, date_signalement, statut, id_utilisateur)
SELECT 
    pr.titre,
    pr.description,
    pr.latitude,
    pr.longitude,
    pr.date_signalement,
    CASE pr.statut
        WHEN 'actif' THEN 'nouveau'
        WHEN 'en_cours' THEN 'en_cours'
        WHEN 'resolu' THEN 'termine'
        WHEN 'rejete' THEN 'rejete'
        ELSE 'nouveau'
    END,
    pr.id_utilisateur_signaleur
FROM probleme_routier pr
WHERE pr.id_signalement IS NULL;

-- Mettre à jour les problèmes routiers avec l'id du signalement créé
-- On utilise une sous-requête pour trouver le signalement correspondant
UPDATE probleme_routier pr
SET id_signalement = s.id_signalement
FROM signalement s
WHERE pr.id_signalement IS NULL
  AND pr.titre = s.titre
  AND pr.latitude = s.latitude
  AND pr.longitude = s.longitude
  AND pr.id_utilisateur_signaleur = s.id_utilisateur;

-- Vérification
SELECT 
    'Problèmes routiers:' AS info,
    COUNT(*) AS total,
    COUNT(id_signalement) AS avec_signalement,
    COUNT(*) - COUNT(id_signalement) AS sans_signalement
FROM probleme_routier;

SELECT 
    'Signalements:' AS info,
    COUNT(*) AS total
FROM signalement;
