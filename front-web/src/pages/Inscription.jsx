import { useEffect, useId, useState } from 'react'
import { getRoles, registerUser } from '../api/client.js'

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
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
      <h1 className="text-2xl font-semibold text-white">Inscription</h1>
      <p className="mt-1 text-sm text-slate-300">Créez votre compte Clouds5.</p>

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
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={nomId} className="text-sm font-medium text-slate-200">
              Nom
            </label>
            <input
              id={nomId}
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={prenomId} className="text-sm font-medium text-slate-200">
              Prénom
            </label>
            <input
              id={prenomId}
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={roleId} className="text-sm font-medium text-slate-200">
            Rôle
          </label>
          <select
            id={roleId}
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            disabled={rolesLoading || roles.length === 0}
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:border-indigo-400"
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
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>

        {rolesError && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{rolesError}</p>}
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {success && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Compte créé avec succès.</p>}
      </form>
    </div>
  )
}
