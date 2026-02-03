export default function Index({ onGoLogin, onGoRegister }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl items-center justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">Clouds5</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Bienvenue</h1>
        <p className="mt-3 text-balance text-base text-slate-300 sm:text-lg">
          Connectez-vous pour accéder à votre espace, ou créez un compte.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
            type="button"
            onClick={onGoLogin}
          >
            Se connecter
          </button>
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            type="button"
            onClick={onGoRegister}
          >
            Créer un compte
          </button>
        </div>

        {/* Section Problèmes Routiers */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3">
            <i className="fa fa-road mr-2 text-indigo-400" />
            Problèmes Routiers
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Consultez la carte des problèmes routiers ou signalez un nouveau problème.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/carte-problemes"
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition hover:bg-green-500"
            >
              <i className="fa fa-map-marker mr-2" />
              Voir la carte
            </a>
            <a
              href="/signaler-probleme"
              className="rounded-xl border border-orange-500/50 bg-orange-500/10 px-5 py-3 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
            >
              <i className="fa fa-plus-circle mr-2" />
              Signaler un problème
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
          <p>
            Astuce: le token est stocké dans <span className="font-mono text-indigo-200">localStorage</span>{' '}
            après connexion.
          </p>
        </div>
      </section>
    </main>
  )
}
