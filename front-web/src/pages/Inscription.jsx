import { useEffect, useId, useState } from 'react'
import { getRoles, registerUser } from '../api/client.js'

export default function Inscription({ onGoLogin } = {}) {
  const emailId = useId()
  const passwordId = useId()
  const nomId = useId()
  const prenomId = useId()
  const roleId = useId()

  const [email, setEmail] = useState('test@mail.com')
  const [motDePasse, setMotDePasse] = useState('12345678')
  const [nom, setNom] = useState('RAN')
  const [prenom, setPrenom] = useState('Antonio')

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
        const data = await getRoles()
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
      const idRole = Number(selectedRoleId)
      if (!selectedRoleId || Number.isNaN(idRole)) {
        throw new Error('Veuillez sélectionner un rôle')
      }

      await registerUser({
        email,
        motDePasse,
        nom: nom || undefined,
        prenom: prenom || undefined,
        idRole,
      })

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
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
      <h1 className="text-2xl font-semibold text-slate-800"><i className="fa fa-user-plus mr-2 text-indigo-500" aria-hidden="true"/>Inscription</h1>
      <p className="mt-1 text-sm text-slate-500">Créez votre compte Clouds5.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor={emailId} className="text-sm font-medium text-slate-700">
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
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={passwordId} className="text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <input
            id={passwordId}
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="new-password"
            minLength={4}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={nomId} className="text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              id={nomId}
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={prenomId} className="text-sm font-medium text-slate-700">
              Prénom
            </label>
            <input
              id={prenomId}
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={roleId} className="text-sm font-medium text-slate-700">
            Rôle
          </label>
          <select
            id={roleId}
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            disabled={rolesLoading || roles.length === 0}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
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

        <button
          className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
          type="submit"
          disabled={loading || rolesLoading}
        >
          <i className="fa fa-user-plus mr-2" aria-hidden="true" />
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        {rolesError && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{rolesError}</p>}
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Compte créé avec succès.</p>}

        <div className="mt-4 text-center">
          <button type="button" className="text-sm text-indigo-600 hover:text-indigo-500" onClick={() => onGoLogin?.()}>
            <i className="fa fa-sign-in mr-2" aria-hidden="true"/>Déjà inscrit ? Se connecter
          </button>
        </div>
      </form>
    </div>
  )
}
