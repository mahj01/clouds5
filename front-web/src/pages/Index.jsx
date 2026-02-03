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
      </section>
    </main>
  )
}
