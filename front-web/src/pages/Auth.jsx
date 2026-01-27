import { useId, useState } from 'react'
import { loginUser, registerUser } from '../api/client.js'

export default function Auth() {
  // Login state
  const loginEmailId = useId()
  const loginPasswordId = useId()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Register state
  const registerEmailId = useId()
  const registerPasswordId = useId()
  const registerNomId = useId()
  const registerPrenomId = useId()
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerNom, setRegisterNom] = useState('')
  const [registerPrenom, setRegisterPrenom] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // Panel state: 'login' or 'register'
  const [activePanel, setActivePanel] = useState('login')

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginSuccess(false)
    setLoginLoading(true)

    try {
      await loginUser({ email: loginEmail, motDePasse: loginPassword })

      setLoginSuccess(true)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegisterError('')
    setRegisterSuccess(false)
    setRegisterLoading(true)

    try {
      await registerUser({
        email: registerEmail,
        motDePasse: registerPassword,
        nom: registerNom || undefined,
        prenom: registerPrenom || undefined,
      })

      setRegisterSuccess(true)
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">Clouds5</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Connexion</h1>
          <p className="mt-1 text-sm text-slate-300">Accédez à votre espace en toute sécurité.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor={loginEmailId} className="text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id={loginEmailId}
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="votre@email.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={loginPasswordId} className="text-sm font-medium text-slate-200">
              Mot de passe
            </label>
            <input
              id={loginPasswordId}
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
            />
          </div>

          <button
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
            type="submit"
            disabled={loginLoading}
          >
            {loginLoading ? 'Connexion…' : 'Se connecter'}
          </button>

          {loginError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{loginError}</p>}
          {loginSuccess && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Connexion réussie !</p>}
        </form>
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Inscription</h2>
          <p className="mt-1 text-sm text-slate-300">Créez un compte en quelques clics.</p>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label htmlFor={registerEmailId} className="text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id={registerEmailId}
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="votre@email.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={registerPasswordId} className="text-sm font-medium text-slate-200">
              Mot de passe
            </label>
            <input
              id={registerPasswordId}
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={registerNomId} className="text-sm font-medium text-slate-200">
                Nom
              </label>
              <input
                id={registerNomId}
                type="text"
                value={registerNom}
                onChange={(e) => setRegisterNom(e.target.value)}
                placeholder="Nom"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={registerPrenomId} className="text-sm font-medium text-slate-200">
                Prénom
              </label>
              <input
                id={registerPrenomId}
                type="text"
                value={registerPrenom}
                onChange={(e) => setRegisterPrenom(e.target.value)}
                placeholder="Prénom"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
              />
            </div>
          </div>

          <button
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            type="submit"
            disabled={registerLoading}
          >
            {registerLoading ? 'Création…' : 'Créer mon compte'}
          </button>

          {registerError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{registerError}</p>}
          {registerSuccess && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Compte créé avec succès !</p>}
        </form>

        <div className="flex gap-3">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${activePanel === 'login' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-200'}`}
            type="button"
            onClick={() => setActivePanel('login')}
          >
            Se connecter
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${activePanel === 'register' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-200'}`}
            type="button"
            onClick={() => setActivePanel('register')}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  )
}
