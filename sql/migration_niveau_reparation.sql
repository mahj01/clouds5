-- =============================================
-- TABLE : NIVEAU_REPARATION
-- Permet au manager de definir et gerer les niveaux de reparation (1 à 10)
-- =============================================
CREATE TABLE niveau_reparation (
    id_niveau_reparation SERIAL PRIMARY KEY,
    niveau INTEGER NOT NULL CHECK (niveau >= 1 AND niveau <= 10) UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    couleur VARCHAR(20)
);

-- Index pour les recherches par niveau
CREATE INDEX idx_niveau_reparation_niveau ON niveau_reparation(niveau);

-- Donnees initiales (facultatif - à adapter selon vos besoins)
INSERT INTO niveau_reparation (niveau, libelle, description, couleur) VALUES
(1, 'Tres faible', 'Reparation mineure, peu urgente', '#00FF00'),
(2, 'Faible', 'Reparation simple', '#7FFF00'),
(3, 'Legere', 'Petite intervention necessaire', '#ADFF2F'),
(4, 'Moderee basse', 'Intervention moderee', '#FFFF00'),
(5, 'Moderee', 'Reparation de difficulte moyenne', '#FFD700'),
(6, 'Moderee haute', 'Reparation significative', '#FFA500'),
(7, 'Importante', 'Reparation consequente', '#FF8C00'),
(8, 'elevee', 'Reparation majeure requise', '#FF4500'),
(9, 'Tres elevee', 'Intervention urgente necessaire', '#FF0000'),
(10, 'Critique', 'Reparation critique et prioritaire', '#8B0000');
