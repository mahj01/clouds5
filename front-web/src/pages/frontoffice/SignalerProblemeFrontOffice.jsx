import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTypesProblemeActifs, createProblemeRoutier } from '../../api/problemes.js'

export default function SignalerProblemeFrontOffice() {
  const navigate = useNavigate()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    typeProblemeId: '',
    adresse: '',
    priorite: 1,
    latitude: -18.8792,
    longitude: 47.5079,
  })

  useEffect(() => {
    loadTypes()
  }, [])

  async function loadTypes() {
    try {
      const data = await getTypesProblemeActifs()
      setTypes(data || [])
      if (data?.length > 0) {
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
      const userId = parseInt(localStorage.getItem('auth_user_id') || '1')
      await createProblemeRoutier({
        ...formData,
        typeProblemeId: parseInt(formData.typeProblemeId),
        utilisateurSignaleurId: userId,
      })
      setSuccess(true)
      setTimeout(() => navigate('/carte-problemes'), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleGetLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }))
        },
        (err) => {
          setError('Impossible d\'obtenir votre position: ' + err.message)
        }
      )
    } else {
      setError('La géolocalisation n\'est pas supportée par votre navigateur')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <i className="fa fa-check text-4xl text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Merci pour votre signalement !</h1>
          <p className="mt-2 text-slate-400">Votre problème a été enregistré avec succès.</p>
          <p className="text-sm text-slate-500 mt-4">Redirection vers la carte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <i className="fa fa-plus-circle text-indigo-400 mr-3" />
            Signaler un Problème
          </h1>
          <p className="mt-2 text-slate-400">
            Aidez-nous à améliorer les routes en signalant les problèmes que vous rencontrez
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/20 p-4 text-red-300 text-sm">
              <i className="fa fa-exclamation-circle mr-2" />{error}
            </div>
          )}

          {/* Type de problème */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa fa-tag mr-2" />Type de problème *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, typeProblemeId: type.id })}
                  className={`p-3 rounded-xl border text-left transition ${
                    formData.typeProblemeId === type.id
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: type.couleur + '30' }}
                  >
                    <i className={`fa ${type.icone || 'fa-warning'}`} style={{ color: type.couleur }} />
                  </div>
                  <div className="text-sm font-medium text-white">{type.nom}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa fa-heading mr-2" />Titre du problème *
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
              placeholder="Ex: Nid de poule dangereux"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa fa-align-left mr-2" />Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
              rows={4}
              placeholder="Décrivez le problème en détail..."
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa fa-map-marker mr-2" />Adresse / Lieu
            </label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
              placeholder="Ex: Avenue de l'Indépendance, Antananarivo"
            />
          </div>

          {/* Coordonnées GPS */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa fa-crosshairs mr-2" />Position GPS
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
                  placeholder="Latitude"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
                  placeholder="Longitude"
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10 hover:bg-white/20"
                title="Utiliser ma position actuelle"
              >
                <i className="fa fa-location-arrow" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cliquez sur l'icône pour utiliser votre position actuelle
            </p>
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <i className="fa fa-flag mr-2" />Niveau d'urgence
            </label>
            <div className="flex gap-3">
              {[
                { value: 1, label: 'Normal', color: 'bg-blue-500' },
                { value: 2, label: 'Important', color: 'bg-orange-500' },
                { value: 3, label: 'Urgent', color: 'bg-red-500' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priorite: opt.value })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
                    formData.priorite === opt.value
                      ? `${opt.color} border-transparent text-white`
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/carte-problemes')}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <><i className="fa fa-spinner fa-spin mr-2" />Envoi...</>
              ) : (
                <><i className="fa fa-paper-plane mr-2" />Envoyer le signalement</>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
          <i className="fa fa-info-circle mr-2 text-indigo-400" />
          Votre signalement sera examiné par notre équipe et traité dans les meilleurs délais.
        </div>
      </div>
    </div>
  )
}
