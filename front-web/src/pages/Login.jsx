import { useId, useState } from 'react'
import { loginUser, loginVisitor } from '../api/client.js'

export default function Login({ onGoRegister, onLoginSuccess } = {}) {
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const [loading, setLoading] = useState(false)
  const [visitorLoading, setVisitorLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenStored, setTokenStored] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setTokenStored(false)
    setLoading(true)

    try {
      const data = await loginUser({ email, motDePasse })

      if (data?.token && data?.expiresAt) {
        // Le stockage durable est géré par App.jsx (token + expiration uniquement)
        onLoginSuccess?.({ token: data.token, expiresAt: data.expiresAt })
        setTokenStored(true)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function handleVisitor() {
    setError('')
    setSuccess(false)
    setTokenStored(false)
    setVisitorLoading(true)

    try {
      const data = await loginVisitor()
      if (data?.token && data?.expiresAt) {
        onLoginSuccess?.({ token: data.token, expiresAt: data.expiresAt })
        setTokenStored(true)
        setSuccess(true)
      } else {
        throw new Error('Réponse invalide du serveur')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setVisitorLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
      <h1 className="text-2xl font-semibold text-white"><i className="fa fa-sign-in mr-2" aria-hidden="true"/>Connexion</h1>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor={emailId} className="text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: user@mail.com"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={passwordId} className="text-sm font-medium text-slate-200">
            Mot de passe
          </label>
          <input
            id={passwordId}
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
          />
        </div>

        <button
          className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
          type="submit"
          disabled={loading}
        >
          <i className="fa fa-sign-in mr-2" aria-hidden="true" />
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <button
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          type="button"
          onClick={handleVisitor}
          disabled={loading || visitorLoading}
        >
          <i className="fa fa-user mr-2" aria-hidden="true" />
          {visitorLoading ? 'Connexion visiteur…' : 'Continuer en visiteur'}
        </button>

        <button
          className="w-full text-sm text-indigo-200 transition hover:text-indigo-100"
          type="button"
          onClick={() => onGoRegister?.()}
          disabled={loading || visitorLoading}
        >
          <i className="fa fa-user-plus mr-2" aria-hidden="true" />
          Pas de compte ? S’inscrire
        </button>

        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {success && (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Connexion réussie{tokenStored ? ' (token enregistré).' : '.'}
          </p>
        )}
      </form>
    </div>
  )
}
