import { useEffect, useMemo, useState } from 'react'
import { getEntreprises, getSignalements, updateSignalement } from '../../api/client.js'

const STATUTS = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
]

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num)
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(num)
}

export default function Signalements() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [signalements, setSignalements] = useState([])
  const [entreprises, setEntreprises] = useState([])

  const [editing, setEditing] = useState(null) // signalement object
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    titre: '',
    description: '',
    statut: 'nouveau',
    surfaceM2: '',
    budget: '',
    entrepriseId: '',
  })

  async function refresh() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [sigs, ents] = await Promise.all([getSignalements(), getEntreprises()])
      setSignalements(Array.isArray(sigs) ? sigs : [])
      setEntreprises(Array.isArray(ents) ? ents : [])
    } catch (e) {
      setError(e?.message ? String(e.message) : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const entrepriseOptions = useMemo(() => {
    return (Array.isArray(entreprises) ? entreprises : [])
      .slice()
      .sort((a, b) => String(a?.nom || '').localeCompare(String(b?.nom || '')))
  }, [entreprises])

  function openEdit(s) {
    setEditing(s)
    setSuccess(null)
    setError(null)
    setForm({
      titre: s?.titre ?? '',
      description: s?.description ?? '',
      statut: s?.statut ?? 'nouveau',
      surfaceM2: s?.surfaceM2 ?? '',
      budget: s?.budget ?? '',
      entrepriseId: s?.entreprise?.id ? String(s.entreprise.id) : '',
    })
  }

  function closeEdit() {
    setEditing(null)
  }

  async function saveEdit() {
    if (!editing?.id) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        titre: form.titre === '' ? null : form.titre,
        description: form.description === '' ? null : form.description,
        statut: form.statut,
        surfaceM2: form.surfaceM2 === '' ? null : Number(form.surfaceM2),
        budget: form.budget === '' ? null : Number(form.budget),
        entrepriseId: form.entrepriseId === '' ? null : Number(form.entrepriseId),
      }
      await updateSignalement(editing.id, payload)
      setSuccess('Signalement mis à jour.')
      closeEdit()
      await refresh()
    } catch (e) {
      setError(e?.message ? String(e.message) : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800"><i className="fa fa-exclamation-triangle mr-2 text-indigo-500"/>Signalements</h2>
          <p className="mt-2 text-sm text-slate-500">Modifier statut, surface (m²), budget et entreprise concernée.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 shadow-sm"
          onClick={refresh}
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Surface</th>
              <th className="px-3 py-2">Budget</th>
              <th className="px-3 py-2">Entreprise</th>
              <th className="px-3 py-2">Utilisateur</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-sm text-slate-500" colSpan={7}>Chargement…</td>
              </tr>
            ) : (Array.isArray(signalements) ? signalements : []).length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-sm text-slate-500" colSpan={7}>Aucun signalement.</td>
              </tr>
            ) : (
              (Array.isArray(signalements) ? signalements : []).map((s) => (
                <tr key={s.id} className="rounded-2xl bg-slate-50 hover:bg-slate-100">
                  <td className="px-3 py-3 text-sm text-slate-800">{s.titre || '—'}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{s.statut || '—'}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{formatNumber(s.surfaceM2)} m²</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{formatMoney(s.budget)}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{s.entreprise?.nom || '—'}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{s.utilisateur?.email || '—'}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 shadow-sm"
                      onClick={() => openEdit(s)}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Modifier signalement</h3>
                <p className="mt-1 text-xs text-slate-500">ID: {editing.id}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                onClick={closeEdit}
                disabled={saving}
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-slate-600">Titre</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-xs text-slate-600">Statut</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.statut}
                  onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}
                >
                  {STATUTS.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-slate-600">Surface (m²)</span>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.surfaceM2}
                  onChange={(e) => setForm((f) => ({ ...f, surfaceM2: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-xs text-slate-600">Budget (€)</span>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs text-slate-600">Entreprise concernée</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.entrepriseId}
                  onChange={(e) => setForm((f) => ({ ...f, entrepriseId: e.target.value }))}
                >
                  <option value="">Aucune</option>
                  {entrepriseOptions.map((ent) => (
                    <option key={ent.id} value={String(ent.id)}>
                      {ent.nom} (id: {ent.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs text-slate-600">Description</span>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                onClick={closeEdit}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 shadow-sm"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}