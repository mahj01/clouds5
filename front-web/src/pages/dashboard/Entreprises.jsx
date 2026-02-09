import { useEffect, useState } from 'react'
import { getEntreprises, createEntreprise, updateEntreprise, deleteEntreprise } from '../../api/client.js'

const EMPTY_FORM = { nom: '', contact: '', description: '' }

export default function Entreprises() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [entreprises, setEntreprises] = useState([])
  const [search, setSearch] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getEntreprises()
      setEntreprises(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(t)
    }
  }, [success])

  const filtered = entreprises.filter((e) => {
    const q = search.toLowerCase()
    return (
      (e.nom || '').toLowerCase().includes(q) ||
      (e.contact || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(ent) {
    setEditing(ent)
    setForm({ nom: ent.nom || '', contact: ent.contact || '', description: ent.description || '' })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateEntreprise(editing.id, form)
        setSuccess(`Entreprise "${form.nom}" modifiée.`)
      } else {
        await createEntreprise(form)
        setSuccess(`Entreprise "${form.nom}" créée.`)
      }
      closeModal()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ent) {
    setConfirmDelete(null)
    setError(null)
    try {
      await deleteEntreprise(ent.id)
      setSuccess(`Entreprise "${ent.nom}" supprimée.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression')
    }
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            <i className="fa fa-building mr-2 text-indigo-500" />
            Gestion des Entreprises
          </h2>
          <p className="mt-1 text-sm text-slate-500">{entreprises.length} entreprise(s) enregistrée(s)</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-600"
        >
          <i className="fa fa-plus" /> Nouvelle entreprise
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <i className="fa fa-check-circle mr-2" />{success}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, contact ou description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-slate-400">
          <i className="fa fa-spinner fa-spin mr-2" />Chargement...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    {search ? 'Aucun résultat pour cette recherche.' : 'Aucune entreprise enregistrée.'}
                  </td>
                </tr>
              ) : (
                filtered.map((ent) => (
                  <tr key={ent.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">{ent.id}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{ent.nom}</td>
                    <td className="px-5 py-3 text-slate-600">{ent.contact || '—'}</td>
                    <td className="max-w-xs truncate px-5 py-3 text-slate-500">{ent.description || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(ent)}
                        className="mr-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200"
                        title="Modifier"
                      >
                        <i className="fa fa-pencil mr-1" />Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(ent)}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200"
                        title="Supprimer"
                      >
                        <i className="fa fa-trash mr-1" />Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                <i className={`fa ${editing ? 'fa-pencil' : 'fa-plus-circle'} mr-2 text-indigo-500`} />
                {editing ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contact</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Téléphone, email..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Description de l'entreprise..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow transition hover:bg-indigo-600 disabled:opacity-60"
                >
                  {saving ? (
                    <><i className="fa fa-spinner fa-spin mr-2" />Enregistrement...</>
                  ) : (
                    <><i className="fa fa-save mr-2" />{editing ? 'Modifier' : 'Créer'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-red-700">
              <i className="fa fa-exclamation-triangle mr-2" />Confirmer la suppression
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Voulez-vous vraiment supprimer l'entreprise <strong>{confirmDelete.nom}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-red-600"
              >
                <i className="fa fa-trash mr-2" />Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}