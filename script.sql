-- =============================================
-- TABLE : UTILISATEUR
-- =============================================
CREATE TABLE utilisateur (
    id_utilisateur SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    nom VARCHAR(50),
    prenom VARCHAR(50),
    role VARCHAR(20) CHECK (role IN ('VISITEUR', 'UTILISATEUR', 'MANAGER')) NOT NULL,
    statut_compte VARCHAR(20) CHECK (statut_compte IN ('actif', 'bloque')) DEFAULT 'actif',
    nb_tentatives INTEGER DEFAULT 0,
    date_blocage TIMESTAMP,
    source_auth VARCHAR(20) CHECK (source_auth IN ('firebase', 'postgres')) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =============================================
-- TABLE : SESSION
-- =============================================
CREATE TABLE session (
    id_session SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    id_utilisateur INTEGER NOT NULL,
    CONSTRAINT fk_session_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
);

-- =============================================
-- TABLE : TENTATIVE_CONNEXION
-- =============================================
CREATE TABLE tentative_connexion (
    id_tentative SERIAL PRIMARY KEY,
    date_tentative TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    succes BOOLEAN NOT NULL,
    ip VARCHAR(45),
    id_utilisateur INTEGER NOT NULL,
    CONSTRAINT fk_tentative_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
);

-- =============================================
-- TABLE : ENTREPRISE
-- =============================================
CREATE TABLE entreprise (
    id_entreprise SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    contact VARCHAR(100),
    description TEXT
);

-- =============================================
-- TABLE : SIGNALEMENT
-- =============================================
CREATE TABLE signalement (
    id_signalement SERIAL PRIMARY KEY,
    titre VARCHAR(100),
    description TEXT,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) CHECK (statut IN ('nouveau', 'en_cours', 'termine')) DEFAULT 'nouveau',
    surface_m2 DECIMAL(10,2),
    budget DECIMAL(12,2),
    id_utilisateur INTEGER NOT NULL,
    id_entreprise INTEGER,
    CONSTRAINT fk_signalement_user
        FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE,
    CONSTRAINT fk_signalement_entreprise
        FOREIGN KEY (id_entreprise)
        REFERENCES entreprise(id_entreprise)
        ON DELETE SET NULL
);


-- =============================================
-- TABLE : HISTORIQUE_STATUT
-- =============================================
CREATE TABLE historique_statut (
    id_historique SERIAL PRIMARY KEY,
    ancien_statut VARCHAR(20),
    nouveau_statut VARCHAR(20),
    date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_signalement INTEGER NOT NULL,
    id_manager INTEGER NOT NULL,
    CONSTRAINT fk_hist_signalement
        FOREIGN KEY (id_signalement)
        REFERENCES signalement(id_signalement)
        ON DELETE CASCADE,
    CONSTRAINT fk_hist_manager
        FOREIGN KEY (id_manager)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE RESTRICT
);

-- =============================================
-- TABLE : SYNCHRONISATION
-- =============================================
CREATE TABLE synchronisation (
    id_sync SERIAL PRIMARY KEY,
    type_sync VARCHAR(30) CHECK (type_sync IN ('firebase_to_local', 'local_to_firebase')) NOT NULL,
    date_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) CHECK (statut IN ('succes', 'echec')) NOT NULL,
    id_manager INTEGER NOT NULL,
    CONSTRAINT fk_sync_manager
        FOREIGN KEY (id_manager)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE RESTRICT
);


CREATE INDEX idx_user_email ON utilisateur(email);
CREATE INDEX idx_signalement_statut ON signalement(statut);
CREATE INDEX idx_signalement_position ON signalement(latitude, longitude);
CREATE INDEX idx_session_token ON session(token);
