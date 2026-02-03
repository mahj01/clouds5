-- Script de données de test pour front-web (déblocage + signalements)
-- Date: 2026-01-27
--
-- But:
-- 1) créer les rôles (manager/client)
-- 2) créer des statuts_compte (actif, bloqué)
-- 3) créer un manager + un client bloqué
-- 4) créer l'historique_status_utilisateur (dernier = bloqué)
-- 5) créer une entreprise + un signalement à éditer
--
-- Notes:
-- - mots de passe hashés bcrypt (compatibles bcryptjs/bcrypt compare)
--   manager123 => $2b$10$4l.1/P1ZVuMURJHClf/8geLUZjpUWKrZ6ENwqI25JY6mptU5/0ioC
--   client123  => $2b$10$BPJQboB/D.9ZrQpB24KRc.tekmcs4QwLVz8BsoMe1pxkwC/xj3ax6

BEGIN;

-- 1) Rôles
INSERT INTO role (nom)
SELECT 'manager'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE nom = 'manager');

INSERT INTO role (nom)
SELECT 'client'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE nom = 'client');

-- 2) Statuts compte
INSERT INTO statut_compte (statut)
SELECT 'actif'
WHERE NOT EXISTS (SELECT 1 FROM statut_compte WHERE statut = 'actif');

INSERT INTO statut_compte (statut)
SELECT 'bloqué'
WHERE NOT EXISTS (SELECT 1 FROM statut_compte WHERE statut = 'bloqué');

-- 3) Utilisateurs
-- Manager
INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, id_role, nb_tentatives, date_blocage)
SELECT
  'manager@test.local',
  'manager123',
  'Manager',
  'Test',
  (SELECT id_role FROM role WHERE nom = 'manager' LIMIT 1),
  0,
  NULL
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'manager@test.local');


-- Client bloqué
INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, id_role, nb_tentatives, date_blocage)
SELECT
  'client.bloque@test.local',
  'client123',
  'Client',
  'Bloqué',
  (SELECT id_role FROM role WHERE nom = 'client' LIMIT 1),
  5,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'client.bloque@test.local');

-- 4) Historique status utilisateur
-- Forcer un statut "bloqué" comme dernier statut (id le plus grand)
INSERT INTO historique_status_utilisateur (id_utilisateur, id_statut_compte)
SELECT
  (SELECT id_utilisateur FROM utilisateur WHERE email = 'client.bloque@test.local' LIMIT 1),
  (SELECT id_statut_compte FROM statut_compte WHERE statut = 'bloqué' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1
  FROM historique_status_utilisateur h
  JOIN utilisateur u ON u.id_utilisateur = h.id_utilisateur
  JOIN statut_compte s ON s.id_statut_compte = h.id_statut_compte
  WHERE u.email = 'client.bloque@test.local' AND s.statut = 'bloqué'
);

-- 5) Entreprise + signalement
INSERT INTO entreprise (nom, contact, description)
SELECT
  'Entreprise Test',
  'contact@test.local',
  'Entreprise de démonstration'
WHERE NOT EXISTS (SELECT 1 FROM entreprise WHERE nom = 'Entreprise Test');

INSERT INTO signalement (
  titre,
  description,
  latitude,
  longitude,
  statut,
  surface_m2,
  budget,
  id_utilisateur,
  id_entreprise
)
SELECT
  'Signalement test',
  'Un signalement pour tester la modification (surface/budget/entreprise/statut).',
  48.8566,
  2.3522,
  'nouveau',
  42.50,
  12000.00,
  (SELECT id_utilisateur FROM utilisateur WHERE email = 'client.bloque@test.local' LIMIT 1),
  (SELECT id_entreprise FROM entreprise WHERE nom = 'Entreprise Test' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM signalement WHERE titre = 'Signalement test');

COMMIT;

-- Identifiants de test:
-- - manager@test.local / manager123  (rôle manager)
-- - client.bloque@test.local / client123 (rôle client + bloqué)
