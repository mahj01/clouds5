import { useState, useEffect, useRef, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import CarteProblemes from '../../components/problemes/CarteProblemes.jsx'
import { getSignalements } from '../../api/client.js'
import { getTypesProblemeActifs } from '../../api/problemes.js'
import { canEdit as checkCanEdit, isVisitor as checkIsVisitor } from '../../constants/dashboardNav.js'

const STATUTS = {
  actif: { label: 'Actif', color: 'bg-red-100 text-red-700' },
  en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  resolu: { label: 'Résolu', color: 'bg-green-100 text-green-700' },
  rejete: { label: 'Rejeté', color: 'bg-gray-100 text-gray-700' },
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TableauSyntheseFrontOffice() {
  // Récupérer le contexte du layout (rôle utilisateur)
  const outletContext = useOutletContext() || {}
  const roleName = outletContext.roleName || localStorage.getItem('auth_role') || 'visiteur'
  const canEdit = useMemo(() => checkCanEdit(roleName), [roleName])
  const isVisitor = useMemo(() => checkIsVisitor(roleName), [roleName])

  const [signalements, setSignalements] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // État de synchronisation entre carte et tableau
  const [selectedId, setSelectedId] = useState(null)
  const [selectedProbleme, setSelectedProbleme] = useState(null)
  
  // Filtres
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreType, setFiltreType] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')

  // Référence pour le scroll automatique
  const tableContainerRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [signalementsData, typesData] = await Promise.all([
        getSignalements(),
        getTypesProblemeActifs(),
      ])
      setSignalements(Array.isArray(signalementsData) ? signalementsData : [])
      setTypes(Array.isArray(typesData) ? typesData : [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les signalements
  const signalementsFiltres = signalements.filter((s) => {
    if (filtreStatut !== 'tous' && s.statut !== filtreStatut) return false
    if (filtreType !== 'tous' && s.typeProbleme?.id !== parseInt(filtreType)) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        s.titre?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search) ||
        s.adresse?.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Stats
  const stats = {
    total: signalements.length,
    actifs: signalements.filter((s) => s.statut === 'actif').length,
    enCours: signalements.filter((s) => s.statut === 'en_cours').length,
    resolus: signalements.filter((s) => s.statut === 'resolu').length,
  }

  // Quand on clique sur un élément du tableau → centrer la carte
  function handleSelectFromTable(signalement) {
    setSelectedId(signalement.id)
    setSelectedProbleme({
      id: signalement.id,
      longitude: signalement.longitude,
      latitude: signalement.latitude,
    })
  }

  // Quand on clique sur un marqueur de la carte → surligner dans le tableau et scroll
  function handleMarkerClick(problemeData) {
    setSelectedId(problemeData.id)
    
    // Scroll vers l'élément dans le tableau
    setTimeout(() => {
      const element = document.getElementById(`signalement-row-${problemeData.id}`)
      if (element && tableContainerRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fa fa-th-list mr-3 text-indigo-600" />
            Tableau Synthèse
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue synchronisée entre la carte et le tableau des signalements
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-refresh'} mr-2`} />
          Rafraîchir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-700">{stats.actifs}</div>
          <div className="text-sm text-red-600">Actifs</div>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-yellow-700">{stats.enCours}</div>
          <div className="text-sm text-yellow-600">En cours</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-700">{stats.resolus}</div>
          <div className="text-sm text-green-600">Résolus</div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      {/* Layout principal : Carte + Tableau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carte */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">
              <i className="fa fa-map mr-2 text-indigo-500" />
              Carte des signalements
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cliquez sur un marqueur pour le voir dans le tableau
            </p>
          </div>
          <div className="h-[400px] lg:h-[500px]">
            <CarteProblemes
              selectedProbleme={selectedProbleme}
              selectedProblemeId={selectedId}
              onMarkerClick={handleMarkerClick}
              onProblemeCreated={loadData}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">
              <i className="fa fa-list mr-2 text-indigo-500" />
              Liste des signalements ({signalementsFiltres.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cliquez sur une ligne pour la voir sur la carte
            </p>
          </div>

          {/* Filtres */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[150px] rounded-lg bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="rounded-lg bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="tous">Tous les statuts</option>
              {Object.entries(STATUTS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
              className="rounded-lg bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="tous">Tous les types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>

          {/* Liste */}
          <div 
            ref={tableContainerRef}
            className="flex-1 overflow-y-auto max-h-[350px] lg:max-h-[400px]"
          >
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fa fa-spinner fa-spin mr-2" />Chargement...
              </div>
            ) : signalementsFiltres.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun signalement trouvé
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {signalementsFiltres.map((signalement) => (
                  <div
                    key={signalement.id}
                    id={`signalement-row-${signalement.id}`}
                    onClick={() => handleSelectFromTable(signalement)}
                    className={`p-4 cursor-pointer transition ${
                      selectedId === signalement.id
                        ? 'bg-indigo-50 border-l-4 border-indigo-500'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {signalement.typeProbleme && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white"
                              style={{ backgroundColor: signalement.typeProbleme.couleur || '#6366f1' }}
                            >
                              {signalement.typeProbleme.nom}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${STATUTS[signalement.statut]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {STATUTS[signalement.statut]?.label || signalement.statut}
                          </span>
                        </div>

                        {/* Titre */}
                        <h3 className="font-medium text-gray-900 truncate">
                          {signalement.titre || 'Sans titre'}
                        </h3>

                        {/* Infos */}
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                          {signalement.adresse && (
                            <span className="truncate max-w-[200px]">
                              <i className="fa fa-map-marker mr-1" />{signalement.adresse}
                            </span>
                          )}
                          <span>
                            <i className="fa fa-calendar mr-1" />{formatDate(signalement.dateSignalement)}
                          </span>
                        </div>
                      </div>

                      {/* Indicateur de sélection */}
                      {selectedId === signalement.id && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white">
                            <i className="fa fa-map-marker text-xs" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          <i className="fa fa-info-circle mr-2 text-indigo-600" />
          Synchronisation Carte ↔ Tableau
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <i className="fa fa-mouse-pointer text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Cliquez sur le tableau</h3>
              <p className="text-sm text-gray-500">
                La carte se centre automatiquement sur le signalement sélectionné
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <i className="fa fa-map-marker text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Cliquez sur un marqueur</h3>
              <p className="text-sm text-gray-500">
                L'élément correspondant est surligné et visible dans le tableau
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
