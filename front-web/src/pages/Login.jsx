import { useId, useState } from 'react'
import './login.css'

export default function Login({ onGoRegister } = {}) {
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      })

      if (!res.ok) {
        let message = `Erreur ${res.status}`
        try {
          const data = await res.json()
          if (data?.message) {
            message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
          }
        } catch {
          // ignore JSON parsing error
        }
        throw new Error(message)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <h1>Login</h1>

      <form className="login__form" onSubmit={handleSubmit}>
        <div className="login__field">
          <label htmlFor={emailId}>Email</label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: user@mail.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="login__field">
          <label htmlFor={passwordId}>Mot de passe</label>
          <input
            id={passwordId}
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="login__submit" type="submit">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <button
          className="login__switch"
          type="button"
          onClick={() => onGoRegister?.()}
        >
          Pas de compte ? S’inscrire
        </button>

        {error && <p className="login__error">{error}</p>}
        {success && <p className="login__ok">Connexion réussie.</p>}
      </form>
    </div>
  )
}
