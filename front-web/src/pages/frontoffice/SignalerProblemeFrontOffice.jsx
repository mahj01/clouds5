import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getTypesProblemeActifs, createProblemeRoutier } from '../../api/problemes.js'

export default function SignalerProblemeFrontOffice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  // Récupérer les coordonnées depuis l'URL si présentes
  const latFromUrl = searchParams.get('lat')
  const lngFromUrl = searchParams.get('lng')
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    typeProblemeId: '',
    adresse: '',
    priorite: 1,
    latitude: latFromUrl ? parseFloat(latFromUrl) : -18.8792,
    longitude: lngFromUrl ? parseFloat(lngFromUrl) : 47.5079,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <i className="fa fa-check text-4xl text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Merci pour votre signalement !</h1>
          <p className="mt-2 text-gray-500">Votre problème a été enregistré avec succès.</p>
          <p className="text-sm text-gray-400 mt-4">Redirection vers la carte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fa fa-plus-circle text-indigo-600 mr-3" />
            Signaler un Problème
          </h1>
          <p className="mt-2 text-gray-500">
            Aidez-nous à améliorer les routes en signalant les problèmes que vous rencontrez
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600 text-sm">
              <i className="fa fa-exclamation-circle mr-2" />{error}
            </div>
          )}

          {/* Type de problème */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fa fa-tag mr-2 text-indigo-600" />Type de problème *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, typeProblemeId: type.id })}
                  className={`p-3 rounded-xl border text-left transition ${
                    formData.typeProblemeId === type.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: type.couleur + '30' }}
                  >
                    <i className={`fa ${type.icone || 'fa-warning'}`} style={{ color: type.couleur }} />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{type.nom}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fa fa-heading mr-2 text-indigo-600" />Titre du problème *
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
              placeholder="Ex: Nid de poule dangereux"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fa fa-align-left mr-2 text-indigo-600" />Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
              rows={4}
              placeholder="Décrivez le problème en détail..."
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fa fa-map-marker mr-2 text-indigo-600" />Adresse / Lieu
            </label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
              placeholder="Ex: Avenue de l'Indépendance, Antananarivo"
            />
          </div>

          {/* Coordonnées GPS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fa fa-crosshairs mr-2 text-indigo-600" />Position GPS
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
                  placeholder="Latitude"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
                  placeholder="Longitude"
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="rounded-xl bg-gray-100 px-4 py-3 text-gray-700 border border-gray-300 hover:bg-gray-200"
                title="Utiliser ma position actuelle"
              >
                <i className="fa fa-location-arrow" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Cliquez sur l'icône pour utiliser votre position actuelle
            </p>
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fa fa-flag mr-2 text-indigo-600" />Niveau d'urgence
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
                      : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
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
              className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50"
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
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
          <i className="fa fa-info-circle mr-2 text-indigo-600" />
          Votre signalement sera examiné par notre équipe et traité dans les meilleurs délais.
        </div>
      </div>
    </div>
  )
}
