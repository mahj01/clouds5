import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'

function NiveauBadge({ niveau, couleur }) {
  const bgColor = couleur || '#6366f1'
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: bgColor }}
    >
      {niveau}
    </span>
  )
}

export default function NiveauxReparation() {
  const [niveaux, setNiveaux] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    niveau: '',
    libelle: '',
    description: '',
    couleur: '#6366f1',
  })

  async function charger() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/niveaux-reparation')
      setNiveaux(data || [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  function openCreate() {
    setEditItem(null)
    setForm({ niveau: '', libelle: '', description: '', couleur: '#6366f1' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({
      niveau: item.niveau,
      libelle: item.libelle || '',
      description: item.description || '',
      couleur: item.couleur || '#6366f1',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        niveau: Number(form.niveau),
        libelle: form.libelle,
        description: form.description || null,
        couleur: form.couleur || null,
      }
      if (editItem) {
        await apiFetch(`/niveaux-reparation/${editItem.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/niveaux-reparation', { method: 'POST', body: JSON.stringify(payload) })
      }
      setShowModal(false)
      charger()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce niveau de réparation ?')) return
    try {
      await apiFetch(`/niveaux-reparation/${id}`, { method: 'DELETE' })
      charger()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Niveaux de Réparation</h1>
          <p className="text-sm text-slate-500">
            Définir et gérer les niveaux de réparation (1 à 10)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <i className="fa fa-plus" />
          Ajouter un niveau
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Niveau
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 hidden sm:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Couleur
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {niveaux.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aucun niveau de réparation défini
                  </td>
                </tr>
              ) : (
                niveaux.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <NiveauBadge niveau={item.niveau} couleur={item.couleur} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.libelle}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">
                      {item.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded border border-slate-300"
                          style={{ backgroundColor: item.couleur || '#ccc' }}
                        />
                        <span className="text-xs text-slate-500">{item.couleur || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="mr-2 text-indigo-600 hover:text-indigo-800"
                        title="Modifier"
                      >
                        <i className="fa fa-pencil" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editItem ? 'Modifier le niveau' : 'Nouveau niveau de réparation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Niveau (1-10) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.niveau}
                  onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Libellé *
                </label>
                <input
                  type="text"
                  required
                  value={form.libelle}
                  onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex: Critique"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Description du niveau..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Couleur
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.couleur}
                    onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={form.couleur}
                    onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {editItem ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
