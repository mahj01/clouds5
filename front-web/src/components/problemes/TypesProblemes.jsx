import { useState, useEffect, useMemo } from 'react'
import {
  getTypesProblemes,
  createTypeProbleme,
  updateTypeProbleme,
  deleteTypeProbleme,
} from '../../api/problemes.js'

const COULEURS_PREDEFINIES = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33',
  '#33FFF5', '#FF8C33', '#8C33FF', '#33FF8C', '#FF3333',
]

const ICONES_PREDEFINIES = [
  'fa-road', 'fa-warning', 'fa-exclamation-circle', 'fa-car-crash',
  'fa-construction', 'fa-traffic-light', 'fa-tree', 'fa-water',
  'fa-bolt', 'fa-fire', 'fa-snowflake', 'fa-cloud-rain',
]

export default function TypesProblemes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    icone: 'fa-warning',
    couleur: '#FF5733',
    actif: true,
  })

  useEffect(() => {
    loadTypes()
  }, [])

  async function loadTypes() {
    setLoading(true)
    try {
      const data = await getTypesProblemes()
      setTypes(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      nom: '',
      description: '',
      icone: 'fa-warning',
      couleur: '#FF5733',
      actif: true,
    })
    setEditingType(null)
    setShowForm(false)
  }

  function handleEdit(type) {
    setFormData({
      nom: type.nom,
      description: type.description || '',
      icone: type.icone || 'fa-warning',
      couleur: type.couleur || '#FF5733',
      actif: type.actif,
    })
    setEditingType(type)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (editingType) {
        await updateTypeProbleme(editingType.id, formData)
      } else {
        await createTypeProbleme(formData)
      }
      resetForm()
      loadTypes()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type de problème ?')) return
    try {
      await deleteTypeProbleme(id)
      loadTypes()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleToggleActif(type) {
    try {
      await updateTypeProbleme(type.id, { actif: !type.actif })
      loadTypes()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          <i className="fa fa-tags mr-2 text-indigo-600" />
          Types de Problèmes
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <i className={`fa ${showForm ? 'fa-times' : 'fa-plus'} mr-2`} />
          {showForm ? 'Annuler' : 'Nouveau type'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
                placeholder="Ex: Nid de poule"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Icône</label>
              <select
                value={formData.icone}
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
              >
                {ICONES_PREDEFINIES.map((icone) => (
                  <option key={icone} value={icone}>{icone}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
              rows={2}
              placeholder="Description du type de problème..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Couleur</label>
              <div className="flex gap-2 flex-wrap">
                {COULEURS_PREDEFINIES.map((couleur) => (
                  <button
                    key={couleur}
                    type="button"
                    onClick={() => setFormData({ ...formData, couleur })}
                    className={`w-8 h-8 rounded-full border-2 ${formData.couleur === couleur ? 'border-indigo-600' : 'border-gray-300'}`}
                    style={{ backgroundColor: couleur }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="rounded"
                />
                Type actif
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <i className="fa fa-save mr-2" />
              {editingType ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fa fa-spinner fa-spin mr-2" /> Chargement...
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun type de problème configuré
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <div
              key={type.id}
              className={`rounded-xl border p-4 shadow-sm ${type.actif ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: type.couleur + '30' }}
                  >
                    <i className={`fa ${type.icone || 'fa-warning'}`} style={{ color: type.couleur }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{type.nom}</h3>
                    <p className="text-xs text-gray-500">
                      {type.actif ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                </div>
              </div>
              {type.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{type.description}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="rounded px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <i className="fa fa-edit mr-1" /> Modifier
                </button>
                <button
                  onClick={() => handleToggleActif(type)}
                  className={`rounded px-2 py-1 text-xs ${type.actif ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'} hover:opacity-80`}
                >
                  <i className={`fa ${type.actif ? 'fa-eye-slash' : 'fa-eye'} mr-1`} />
                  {type.actif ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="rounded px-2 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200"
                >
                  <i className="fa fa-trash mr-1" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
