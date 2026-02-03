import { useState, useEffect } from 'react'
import { getTypesProblemeActifs, createProblemeRoutier } from '../../api/problemes.js'

export default function FormulaireProbleme({ position, onSuccess, onCancel }) {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    typeProblemeId: '',
    adresse: '',
    priorite: 1,
    latitude: position?.lat || 0,
    longitude: position?.lng || 0,
  })

  useEffect(() => {
    loadTypes()
  }, [])

  useEffect(() => {
    if (position) {
      setFormData((prev) => ({
        ...prev,
        latitude: position.lat,
        longitude: position.lng,
      }))
    }
  }, [position])

  async function loadTypes() {
    try {
      const data = await getTypesProblemeActifs()
      setTypes(data || [])
      if (data?.length > 0 && !formData.typeProblemeId) {
        setFormData((prev) => ({ ...prev, typeProblemeId: data[0].id }))
      }
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Utiliser l'ID utilisateur stocké ou 1 par défaut
      const userId = parseInt(localStorage.getItem('auth_user_id') || '1')
      await createProblemeRoutier({
        ...formData,
        typeProblemeId: parseInt(formData.typeProblemeId),
        utilisateurSignaleurId: userId,
      })
      onSuccess?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/20 p-3 text-red-300 text-sm">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-300 mb-1">Type de problème *</label>
        <select
          required
          value={formData.typeProblemeId}
          onChange={(e) => setFormData({ ...formData, typeProblemeId: e.target.value })}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Sélectionner un type</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Titre *</label>
        <input
          type="text"
          required
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
          placeholder="Ex: Nid de poule dangereux"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
          rows={3}
          placeholder="Décrivez le problème..."
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Adresse</label>
        <input
          type="text"
          value={formData.adresse}
          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
          placeholder="Ex: Avenue de la Liberté, Antananarivo"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Priorité</label>
        <select
          value={formData.priorite}
          onChange={(e) => setFormData({ ...formData, priorite: parseInt(e.target.value) })}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
        >
          <option value={1}>Normale</option>
          <option value={2}>Haute</option>
          <option value={3}>Urgente</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <><i className="fa fa-spinner fa-spin mr-2" />Envoi...</>
          ) : (
            <><i className="fa fa-save mr-2" />Signaler</>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
