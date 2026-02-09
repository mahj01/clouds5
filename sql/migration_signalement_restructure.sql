-- =====================================================
-- Script de migration: Restructuration table signalement
-- Base de données: PostgreSQL
-- =====================================================

-- Ajouter les nouvelles colonnes à la table signalement
ALTER TABLE signalement 
ADD COLUMN IF NOT EXISTS adresse VARCHAR(255),
ADD COLUMN IF NOT EXISTS priorite INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS date_resolution TIMESTAMP,
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS commentaire_resolution TEXT,
ADD COLUMN IF NOT EXISTS id_type_probleme INTEGER REFERENCES type_probleme(id_type_probleme),
ADD COLUMN IF NOT EXISTS id_utilisateur_resolution INTEGER REFERENCES utilisateur(id_utilisateur);

-- Modifier la colonne titre pour permettre plus de caractères
ALTER TABLE signalement 
ALTER COLUMN titre TYPE VARCHAR(150);

-- Migrer les données de probleme_routier vers signalement (si pas déjà fait)
INSERT INTO signalement (
    titre, description, latitude, longitude, adresse, 
    statut, priorite, date_signalement, date_resolution,
    photo_url, commentaire_resolution,
    id_type_probleme, id_utilisateur, id_utilisateur_resolution
)
SELECT 
    pr.titre,
    pr.description,
    pr.latitude,
    pr.longitude,
    pr.adresse,
    CASE pr.statut
        WHEN 'actif' THEN 'actif'
        WHEN 'en_cours' THEN 'en_cours'
        WHEN 'resolu' THEN 'resolu'
        WHEN 'rejete' THEN 'rejete'
        ELSE 'actif'
    END,
    pr.priorite,
    pr.date_signalement,
    pr.date_resolution,
    pr.photo_url,
    pr.commentaire_resolution,
    pr.id_type_probleme,
    pr.id_utilisateur_signaleur,
    pr.id_utilisateur_resolution
FROM probleme_routier pr
WHERE NOT EXISTS (
    SELECT 1 FROM signalement s 
    WHERE s.titre = pr.titre 
    AND s.latitude = pr.latitude 
    AND s.longitude = pr.longitude
);

-- Vérification
SELECT 
    'Signalements après migration:' AS info,
    COUNT(*) AS total,
    COUNT(id_type_probleme) AS avec_type,
    COUNT(date_resolution) AS resolus
FROM signalement;

-- Afficher un résumé par statut
SELECT 
    statut,
    COUNT(*) AS nombre
FROM signalement
GROUP BY statut
ORDER BY nombre DESC;
