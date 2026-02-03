-- =====================================================
-- Script SQL de test pour les Problèmes Routiers
-- Base de données: PostgreSQL
-- =====================================================

-- Création de la table type_probleme (si elle n'existe pas déjà via TypeORM)
-- CREATE TABLE IF NOT EXISTS type_probleme (
--     id_type_probleme SERIAL PRIMARY KEY,
--     nom VARCHAR(100) NOT NULL,
--     description TEXT,
--     icone VARCHAR(50),
--     couleur VARCHAR(20) DEFAULT '#FF5733',
--     actif BOOLEAN DEFAULT TRUE,
--     date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Création de la table probleme_routier (si elle n'existe pas déjà via TypeORM)
-- CREATE TYPE statut_probleme AS ENUM ('actif', 'en_cours', 'resolu', 'rejete');
-- CREATE TABLE IF NOT EXISTS probleme_routier (
--     id_probleme SERIAL PRIMARY KEY,
--     titre VARCHAR(150) NOT NULL,
--     description TEXT,
--     latitude DECIMAL(10, 7) NOT NULL,
--     longitude DECIMAL(10, 7) NOT NULL,
--     adresse VARCHAR(255),
--     statut statut_probleme DEFAULT 'actif',
--     priorite INTEGER DEFAULT 1,
--     date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     date_resolution TIMESTAMP,
--     photo_url VARCHAR(500),
--     commentaire_resolution TEXT,
--     id_type_probleme INTEGER NOT NULL REFERENCES type_probleme(id_type_probleme),
--     id_utilisateur_signaleur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
--     id_utilisateur_resolution INTEGER REFERENCES utilisateur(id_utilisateur)
-- );

-- =====================================================
-- INSERTION DES TYPES DE PROBLÈMES
-- =====================================================

INSERT INTO type_probleme (nom, description, icone, couleur, actif) VALUES
('Nid de poule', 'Trou ou cavité dans la chaussée pouvant endommager les véhicules', 'fa-circle-exclamation', '#FF5733', true),
('Fissure importante', 'Fissures larges ou profondes dans le revêtement routier', 'fa-road', '#FFC300', true),
('Route inondée', 'Accumulation d''eau sur la chaussée rendant la circulation difficile', 'fa-water', '#3498DB', true),
('Effondrement de chaussée', 'Affaissement ou effondrement partiel de la route', 'fa-warning', '#E74C3C', true),
('Signalisation endommagée', 'Panneaux de signalisation cassés, illisibles ou manquants', 'fa-traffic-light', '#9B59B6', true),
('Éclairage défectueux', 'Lampadaires ou éclairage public non fonctionnel', 'fa-bolt', '#F39C12', true),
('Obstacle sur la voie', 'Objet, débris ou obstacle bloquant partiellement la route', 'fa-construction', '#1ABC9C', true),
('Glissement de terrain', 'Éboulement ou glissement de terrain affectant la route', 'fa-tree', '#8B4513', true),
('Dégradation marquage', 'Marquage au sol effacé ou peu visible', 'fa-road', '#7F8C8D', true),
('Pont endommagé', 'Dommages structurels sur un pont ou une passerelle', 'fa-exclamation-circle', '#C0392B', true);

-- =====================================================
-- INSERTION DES PROBLÈMES ROUTIERS (données de test)
-- Note: Assurez-vous d'avoir au moins un utilisateur avec id=1
-- =====================================================

-- Problèmes à Antananarivo et environs (Madagascar)
INSERT INTO probleme_routier (titre, description, latitude, longitude, adresse, statut, priorite, id_type_probleme, id_utilisateur_signaleur) VALUES
-- Nids de poule (type 1)
('Nid de poule dangereux Avenue de l''Indépendance', 'Grand trou d''environ 50cm de diamètre au milieu de la voie, très dangereux pour les deux-roues', -18.9137, 47.5226, 'Avenue de l''Indépendance, Antananarivo', 'actif', 3, 1, 1),
('Série de nids de poule RN7', 'Plusieurs trous consécutifs sur 100m rendant la circulation difficile', -18.9500, 47.5000, 'RN7 km 15, sortie Antananarivo', 'actif', 2, 1, 1),
('Nid de poule devant le marché', 'Trou profond qui se remplit d''eau lors des pluies', -18.9089, 47.5281, 'Rue du Commerce, Analakely', 'en_cours', 2, 1, 1),

-- Fissures (type 2)
('Fissures multiples Boulevard Ratsimilaho', 'Réseau de fissures sur 200m nécessitant une réfection complète', -18.8950, 47.5150, 'Boulevard Ratsimilaho, Antananarivo', 'actif', 1, 2, 1),
('Grande fissure transversale', 'Fissure de 5cm de large traversant toute la chaussée', -18.9200, 47.5300, 'Rue Rainitovo, Antananarivo', 'resolu', 2, 2, 1),

-- Routes inondées (type 3)
('Zone inondable récurrente', 'Cette zone est régulièrement inondée lors des pluies, drainage insuffisant', -18.8800, 47.5400, 'Quartier Andohalo, Antananarivo', 'actif', 2, 3, 1),
('Accumulation d''eau permanente', 'Flaque d''eau stagnante depuis plusieurs semaines', -18.9300, 47.5100, 'Avenue Ny Hasina Andriamanjato', 'en_cours', 1, 3, 1),

-- Effondrement (type 4)
('Affaissement de chaussée critique', 'La route s''est affaissée de 30cm, circulation très dangereuse', -18.8700, 47.5500, 'Route d''Ivato, Antananarivo', 'actif', 3, 4, 1),

-- Signalisation (type 5)
('Stop illisible', 'Panneau stop complètement effacé, carrefour dangereux', -18.9100, 47.5200, 'Carrefour Ambohijatovo', 'resolu', 2, 5, 1),
('Panneau directionnel manquant', 'Le panneau indiquant la direction de l''aéroport a disparu', -18.9000, 47.4800, 'Échangeur Anosizato', 'actif', 1, 5, 1),

-- Éclairage (type 6)
('Lampadaires non fonctionnels', 'Série de 5 lampadaires éteints rendant la zone très sombre la nuit', -18.9250, 47.5350, 'Avenue de l''Université, Ankatso', 'actif', 2, 6, 1),
('Zone non éclairée dangereuse', 'Tronçon de 500m sans aucun éclairage', -18.8850, 47.5050, 'Route digue, Antananarivo', 'en_cours', 2, 6, 1),

-- Obstacles (type 7)
('Débris de construction', 'Tas de gravats laissé sur le bord de la route depuis un mois', -18.9400, 47.5250, 'Rue des Artisans, Antananarivo', 'actif', 1, 7, 1),
('Arbre tombé partiellement', 'Arbre penché menaçant de tomber sur la route', -18.8600, 47.5200, 'Route Ambohidratrimo', 'resolu', 3, 7, 1),

-- Glissement (type 8)
('Éboulement après les pluies', 'Terre et rochers sur la chaussée suite aux fortes pluies', -18.9100, 47.5600, 'Route Ambohimanga', 'actif', 3, 8, 1),

-- Marquage (type 9)
('Passage piéton effacé', 'Marquage du passage piéton complètement effacé devant l''école', -18.9180, 47.5280, 'Rue Razafindratandra, Antananarivo', 'actif', 2, 9, 1),
('Lignes de voies invisibles', 'Le marquage des voies est totalement effacé sur 300m', -18.9050, 47.5150, 'Boulevard de l''Europe', 'en_cours', 1, 9, 1),

-- Pont (type 10)
('Pont avec garde-corps cassé', 'Garde-corps métallique arraché suite à un accident', -18.8900, 47.5450, 'Pont sur l''Ikopa, route d''Ivato', 'actif', 3, 10, 1),
('Fissures sur tablier de pont', 'Fissures visibles sur le tablier du pont, expertise nécessaire', -18.9350, 47.5000, 'Pont Amboditsiry', 'en_cours', 2, 10, 1);

-- Mise à jour des dates de résolution pour les problèmes résolus
UPDATE probleme_routier 
SET date_resolution = date_signalement + INTERVAL '5 days',
    commentaire_resolution = 'Travaux de réparation effectués par l''équipe de maintenance.',
    id_utilisateur_resolution = 1
WHERE statut = 'resolu';

-- =====================================================
-- VÉRIFICATION DES DONNÉES
-- =====================================================

-- Compter les types de problèmes
SELECT 'Types de problèmes créés:' AS info, COUNT(*) AS nombre FROM type_probleme;

-- Compter les problèmes par statut
SELECT 'Problèmes par statut:' AS info, statut, COUNT(*) AS nombre 
FROM probleme_routier 
GROUP BY statut;

-- Compter les problèmes par type
SELECT 'Problèmes par type:' AS info, tp.nom, COUNT(pr.id_probleme) AS nombre 
FROM type_probleme tp
LEFT JOIN probleme_routier pr ON tp.id_type_probleme = pr.id_type_probleme
GROUP BY tp.id_type_probleme, tp.nom
ORDER BY nombre DESC;

-- Afficher un résumé
SELECT 
    'Résumé:' AS info,
    (SELECT COUNT(*) FROM type_probleme) AS "Types créés",
    (SELECT COUNT(*) FROM probleme_routier) AS "Problèmes créés",
    (SELECT COUNT(*) FROM probleme_routier WHERE statut = 'actif') AS "Actifs",
    (SELECT COUNT(*) FROM probleme_routier WHERE statut = 'en_cours') AS "En cours",
    (SELECT COUNT(*) FROM probleme_routier WHERE statut = 'resolu') AS "Résolus";
