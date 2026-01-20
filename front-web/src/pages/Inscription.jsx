import { useId, useState } from 'react'
import './inscription.css'

export default function Inscription() {
  const emailId = useId()
  const passwordId = useId()
  const nomId = useId()
  const prenomId = useId()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')

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

      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          motDePasse,
          nom: nom || undefined,
          prenom: prenom || undefined,
        }),
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
    <div className="inscription">
      <h1>Inscription</h1>

      <form className="inscription__form" onSubmit={handleSubmit}>
        <div className="inscription__field">
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

        <div className="inscription__field">
          <label htmlFor={passwordId}>Mot de passe</label>
          <input
            id={passwordId}
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="inscription__field">
          <label htmlFor={nomId}>Nom</label>
          <input
            id={nomId}
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Votre nom"
          />
        </div>

        <div className="inscription__field">
          <label htmlFor={prenomId}>Prénom</label>
          <input
            id={prenomId}
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Votre prénom"
          />
        </div>

        <button className="inscription__submit" type="submit">
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        {error && <p className="inscription__error">{error}</p>}
        {success && <p className="inscription__ok">Compte créé avec succès.</p>}
      </form>
    </div>
  )
}
