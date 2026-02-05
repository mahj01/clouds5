-- Migration: Ajouter la colonne firebase_uid pour tracker la synchronisation Firebase
-- Exécuter cette migration sur votre base de données PostgreSQL

ALTER TABLE utilisateur 
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) DEFAULT NULL;

-- Index optionnel pour les requêtes de synchronisation
CREATE INDEX IF NOT EXISTS idx_utilisateur_firebase_uid ON utilisateur(firebase_uid);

-- Commentaire
COMMENT ON COLUMN utilisateur.firebase_uid IS 'Firebase UID - NULL si utilisateur non synchronisé avec Firebase';
