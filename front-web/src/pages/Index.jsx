import { useNavigate } from 'react-router-dom'

export default function Index({ onGoLogin, onGoRegister }) {
  const navigate = useNavigate()

  function handleVisitorAccess() {
    // Définir le rôle comme visiteur et accéder au dashboard
    localStorage.setItem('auth_role', 'visiteur')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_expiresAt')
    localStorage.removeItem('auth_userId')
    navigate('/dashboard')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
      <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Clouds5</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-800 md:text-4xl">Bienvenue</h1>
        <p className="mt-3 text-balance text-base text-slate-500 sm:text-lg">
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
            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={onGoRegister}
          >
            Créer un compte
          </button>
        </div>

        {/* Accès visiteur */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-3">
            Vous souhaitez consulter sans vous connecter ?
          </p>
          <button
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            type="button"
            onClick={handleVisitorAccess}
          >
            <i className="fa fa-eye mr-2" />
            Accéder en mode visiteur
          </button>
        </div>
      </section>
    </main>
  )
}
