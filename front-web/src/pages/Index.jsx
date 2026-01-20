export default function Index({ onGoLogin, onGoRegister }) {
  return (
    <main className="index">
      <section className="index__hero">
        <p className="index__kicker">Clouds5</p>
        <h1 className="index__title">Bienvenue</h1>
        <p className="index__subtitle">
          Connectez-vous pour accéder à votre espace, ou créez un compte.
        </p>

        <div className="index__actions">
          <button className="index__primary" type="button" onClick={onGoLogin}>
            Se connecter
          </button>
          <button className="index__secondary" type="button" onClick={onGoRegister}>
            Créer un compte
          </button>
        </div>

        <div className="index__note">
          <p>
            Astuce: le token est stocké dans <span className="index__mono">localStorage</span>{' '}
            après connexion.
          </p>
        </div>
      </section>
    </main>
  )
}
