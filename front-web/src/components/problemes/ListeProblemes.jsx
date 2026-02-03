import { useState, useEffect } from 'react'
import {
  getProblemesRoutiers,
  getTypesProblemeActifs,
  updateProblemeRoutier,
  deleteProblemeRoutier,
  resoudreProbleme,
} from '../../api/problemes.js'

const STATUTS = {
  actif: { label: 'Actif', color: 'bg-red-500', textColor: 'text-red-300' },
  en_cours: { label: 'En cours', color: 'bg-yellow-500', textColor: 'text-yellow-300' },
  resolu: { label: 'Résolu', color: 'bg-green-500', textColor: 'text-green-300' },
  rejete: { label: 'Rejeté', color: 'bg-gray-500', textColor: 'text-gray-300' },
}

export default function ListeProblemes({ onSelectProbleme }) {
  const [problemes, setProblemes] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreType, setFiltreType] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')
  const [showResolutionModal, setShowResolutionModal] = useState(null)
  const [commentaireResolution, setCommentaireResolution] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [problemesData, typesData] = await Promise.all([
        getProblemesRoutiers(),
        getTypesProblemeActifs(),
      ])
      setProblemes(problemesData || [])
      setTypes(typesData || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const problemesFiltres = problemes.filter((p) => {
    if (filtreStatut !== 'tous' && p.statut !== filtreStatut) return false
    if (filtreType !== 'tous' && p.typeProbleme?.id !== parseInt(filtreType)) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        p.titre?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.adresse?.toLowerCase().includes(search)
      )
    }
    return true
  })

  async function handleChangeStatut(id, newStatut) {
    try {
      await updateProblemeRoutier(id, { statut: newStatut })
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleResoudre() {
    if (!showResolutionModal) return
    try {
      // Utiliser l'ID utilisateur stocké ou 1 par défaut
      const userId = parseInt(localStorage.getItem('auth_user_id') || '1')
      await resoudreProbleme(showResolutionModal.id, userId, commentaireResolution)
      setShowResolutionModal(null)
      setCommentaireResolution('')
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce problème ?')) return
    try {
      await deleteProblemeRoutier(id)
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-red-300 text-sm">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
        >
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUTS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value)}
          className="rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none"
        >
          <option value="tous">Tous les types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.nom}</option>
          ))}
        </select>
        <button
          onClick={loadData}
          className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20"
        >
          <i className="fa fa-refresh" />
        </button>
      </div>

      {/* Stats rapides */}
      <div className="mb-4 flex gap-4 text-sm">
        <span className="text-slate-400">
          Total: <span className="text-white font-medium">{problemes.length}</span>
        </span>
        <span className="text-red-400">
          Actifs: <span className="font-medium">{problemes.filter(p => p.statut === 'actif').length}</span>
        </span>
        <span className="text-yellow-400">
          En cours: <span className="font-medium">{problemes.filter(p => p.statut === 'en_cours').length}</span>
        </span>
        <span className="text-green-400">
          Résolus: <span className="font-medium">{problemes.filter(p => p.statut === 'resolu').length}</span>
        </span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">
          <i className="fa fa-spinner fa-spin mr-2" /> Chargement...
        </div>
      ) : problemesFiltres.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          Aucun problème trouvé
        </div>
      ) : (
        <div className="space-y-3">
          {problemesFiltres.map((probleme) => (
            <div
              key={probleme.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {probleme.typeProbleme && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                        style={{ 
                          backgroundColor: probleme.typeProbleme.couleur + '30',
                          color: probleme.typeProbleme.couleur 
                        }}
                      >
                        <i className={`fa ${probleme.typeProbleme.icone || 'fa-warning'}`} />
                        {probleme.typeProbleme.nom}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${STATUTS[probleme.statut]?.textColor || 'text-gray-300'}`}
                      style={{ backgroundColor: STATUTS[probleme.statut]?.color.replace('bg-', '') + '20' }}
                    >
                      {STATUTS[probleme.statut]?.label || probleme.statut}
                    </span>
                    {probleme.priorite > 1 && (
                      <span className="text-xs text-orange-400">
                        <i className="fa fa-flag mr-1" />Priorité {probleme.priorite}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-white">{probleme.titre}</h3>
                  {probleme.description && (
                    <p className="text-sm text-slate-300 mt-1 line-clamp-2">{probleme.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {probleme.adresse && (
                      <span><i className="fa fa-map-marker mr-1" />{probleme.adresse}</span>
                    )}
                    <span><i className="fa fa-calendar mr-1" />{formatDate(probleme.dateSignalement)}</span>
                    {probleme.utilisateurSignaleur && (
                      <span>
                        <i className="fa fa-user mr-1" />
                        {probleme.utilisateurSignaleur.prenom} {probleme.utilisateurSignaleur.nom}
                      </span>
                    )}
                    {probleme.dateResolution && (
                      <span className="text-green-400">
                        <i className="fa fa-check mr-1" />Résolu le {formatDate(probleme.dateResolution)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {onSelectProbleme && (
                    <button
                      onClick={() => onSelectProbleme(probleme)}
                      className="rounded px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                    >
                      <i className="fa fa-map-marker mr-1" /> Voir
                    </button>
                  )}
                  {probleme.statut === 'actif' && (
                    <button
                      onClick={() => handleChangeStatut(probleme.id, 'en_cours')}
                      className="rounded px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                    >
                      <i className="fa fa-play mr-1" /> Prendre en charge
                    </button>
                  )}
                  {(probleme.statut === 'actif' || probleme.statut === 'en_cours') && (
                    <button
                      onClick={() => setShowResolutionModal(probleme)}
                      className="rounded px-2 py-1 text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    >
                      <i className="fa fa-check mr-1" /> Résoudre
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(probleme.id)}
                    className="rounded px-2 py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  >
                    <i className="fa fa-trash mr-1" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de résolution */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              <i className="fa fa-check-circle mr-2 text-green-400" />
              Résoudre le problème
            </h3>
            <p className="text-sm text-slate-300 mb-4">"{showResolutionModal.titre}"</p>
            <textarea
              value={commentaireResolution}
              onChange={(e) => setCommentaireResolution(e.target.value)}
              placeholder="Commentaire de résolution (optionnel)..."
              className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/10 focus:border-indigo-500 focus:outline-none mb-4"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowResolutionModal(null)
                  setCommentaireResolution('')
                }}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Annuler
              </button>
              <button
                onClick={handleResoudre}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <i className="fa fa-check mr-2" />Confirmer la résolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
