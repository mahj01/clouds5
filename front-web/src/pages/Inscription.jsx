import { useEffect, useId, useState } from 'react'
import './inscription.css'

export default function Inscription() {
  const emailId = useId()
  const passwordId = useId()
  const nomId = useId()
  const prenomId = useId()
  const roleId = useId()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')

  const [roles, setRoles] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadRoles() {
      setRolesError('')
      setRolesLoading(true)

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const res = await fetch(`${apiBase}/roles`)
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        if (!cancelled) {
          setRoles(list)
          if (!selectedRoleId && list.length > 0 && list[0]?.id != null) {
            setSelectedRoleId(String(list[0].id))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRolesError(err instanceof Error ? err.message : 'Erreur inconnue')
        }
      } finally {
        if (!cancelled) setRolesLoading(false)
      }
    }

    loadRoles()
    return () => {
      cancelled = true
    }
    // selectedRoleId intentionally omitted: we only auto-select once at load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      const idRole = Number(selectedRoleId)
      if (!selectedRoleId || Number.isNaN(idRole)) {
        throw new Error('Veuillez sélectionner un rôle')
      }

      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          motDePasse,
          nom: nom || undefined,
          prenom: prenom || undefined,
          idRole,
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
      setEmail('')
      setMotDePasse('')
      setNom('')
      setPrenom('')
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

        <div className="inscription__field">
          <label htmlFor={roleId}>Rôle</label>
          <select
            id={roleId}
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            disabled={rolesLoading || roles.length === 0}
            required
          >
            {roles.length === 0 ? (
              <option value="">{rolesLoading ? 'Chargement…' : 'Aucun rôle disponible'}</option>
            ) : (
              roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nom}
                </option>
              ))
            )}
          </select>
        </div>

        <button className="inscription__submit" type="submit" disabled={loading || rolesLoading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        {rolesError && <p className="inscription__error">{rolesError}</p>}
        {error && <p className="inscription__error">{error}</p>}
        {success && <p className="inscription__ok">Compte créé avec succès.</p>}
      </form>
    </div>
  )
}
