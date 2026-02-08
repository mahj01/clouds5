import { useEffect, useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getEntreprises, getSignalements } from '../../api/client.js'
import { canEdit as checkCanEdit, isVisitor as checkIsVisitor } from '../../constants/dashboardNav.js'

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMoney(amount) {
  if (!amount) return '—'
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(amount)
}

const STATUTS_BADGE = {
  actif: 'bg-red-100 text-red-700',
  en_cours: 'bg-yellow-100 text-yellow-700',
  resolu: 'bg-green-100 text-green-700',
  rejete: 'bg-gray-100 text-gray-700',
}

export default function Entreprises() {
  // Récupérer le contexte du layout (rôle utilisateur)
  const outletContext = useOutletContext() || {}
  const roleName = outletContext.roleName || localStorage.getItem('auth_role') || 'visiteur'
  const canEdit = useMemo(() => checkCanEdit(roleName), [roleName])
  const isVisitor = useMemo(() => checkIsVisitor(roleName), [roleName])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [entreprises, setEntreprises] = useState([])
  const [signalements, setSignalements] = useState([])
  
  // Modal pour voir les détails d'une entreprise
  const [viewingEntreprise, setViewingEntreprise] = useState(null)
  const [entrepriseSignalements, setEntrepriseSignalements] = useState([])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [entreprisesData, signalementsData] = await Promise.all([
        getEntreprises(),
        getSignalements(),
      ])
      setEntreprises(Array.isArray(entreprisesData) ? entreprisesData : [])
      setSignalements(Array.isArray(signalementsData) ? signalementsData : [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Ouvrir le modal avec les signalements de l'entreprise
  function openViewEntreprise(entreprise) {
    setViewingEntreprise(entreprise)
    // Filtrer les signalements de cette entreprise
    const sigForEntreprise = signalements.filter(
      (s) => s.entreprise?.id === entreprise.id
    )
    setEntrepriseSignalements(sigForEntreprise)
  }

  function closeModal() {
    setViewingEntreprise(null)
    setEntrepriseSignalements([])
  }

  // Stats par entreprise
  function getEntrepriseStats(entrepriseId) {
    const sigs = signalements.filter((s) => s.entreprise?.id === entrepriseId)
    return {
      total: sigs.length,
      resolus: sigs.filter((s) => s.statut === 'resolu').length,
      enCours: sigs.filter((s) => s.statut === 'en_cours').length,
      actifs: sigs.filter((s) => s.statut === 'actif').length,
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fa fa-building mr-3 text-indigo-600" />
            Entreprises
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isVisitor 
              ? 'Consultez la liste des entreprises partenaires'
              : 'Gérez les entreprises et leurs signalements'
            }
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-refresh'} mr-2`} />
          Rafraîchir
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      {/* Liste des entreprises */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <i className="fa fa-spinner fa-spin mr-2" />Chargement...
          </div>
        ) : entreprises.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Aucune entreprise trouvée.
          </div>
        ) : (
          entreprises.map((entreprise) => {
            const stats = getEntrepriseStats(entreprise.id)
            return (
              <div
                key={entreprise.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      <i className="fa fa-building mr-2 text-indigo-500" />
                      {entreprise.nom || 'Sans nom'}
                    </h3>
                    {entreprise.email && (
                      <p className="mt-1 text-sm text-gray-500">
                        <i className="fa fa-envelope mr-1" />{entreprise.email}
                      </p>
                    )}
                    {entreprise.telephone && (
                      <p className="mt-1 text-sm text-gray-500">
                        <i className="fa fa-phone mr-1" />{entreprise.telephone}
                      </p>
                    )}
                    {entreprise.adresse && (
                      <p className="mt-1 text-sm text-gray-500">
                        <i className="fa fa-map-marker mr-1" />{entreprise.adresse}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats des signalements */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2">
                    <div className="text-lg font-bold text-red-700">{stats.actifs}</div>
                    <div className="text-xs text-red-600">Actifs</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-2">
                    <div className="text-lg font-bold text-yellow-700">{stats.enCours}</div>
                    <div className="text-xs text-yellow-600">En cours</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2">
                    <div className="text-lg font-bold text-green-700">{stats.resolus}</div>
                    <div className="text-xs text-green-600">Résolus</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openViewEntreprise(entreprise)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Voir les signalements"
                  >
                    <i className="fa fa-eye mr-1" />Voir détails
                  </button>
                  
                  {/* Boutons admin seulement */}
                  {canEdit && (
                    <>
                      <button
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
                        title="Modifier l'entreprise"
                      >
                        <i className="fa fa-pencil" />
                      </button>
                      <button
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                        title="Supprimer l'entreprise"
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal - Détails de l'entreprise avec ses signalements */}
      {viewingEntreprise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header du modal */}
            <div className="flex items-start justify-between gap-3 mb-6 border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  <i className="fa fa-building mr-2 text-indigo-500" />
                  {viewingEntreprise.nom}
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                  {viewingEntreprise.email && (
                    <span><i className="fa fa-envelope mr-1" />{viewingEntreprise.email}</span>
                  )}
                  {viewingEntreprise.telephone && (
                    <span><i className="fa fa-phone mr-1" />{viewingEntreprise.telephone}</span>
                  )}
                  {viewingEntreprise.adresse && (
                    <span><i className="fa fa-map-marker mr-1" />{viewingEntreprise.adresse}</span>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                <i className="fa fa-times" />
              </button>
            </div>

            {/* Liste des signalements de l'entreprise */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                <i className="fa fa-exclamation-triangle mr-2 text-orange-500" />
                Signalements assignés ({entrepriseSignalements.length})
              </h4>
              
              {entrepriseSignalements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fa fa-info-circle mr-2" />
                  Aucun signalement assigné à cette entreprise.
                </div>
              ) : (
                <div className="space-y-3">
                  {entrepriseSignalements.map((sig) => (
                    <div
                      key={sig.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {sig.typeProbleme && (
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: sig.typeProbleme.couleur || '#6366f1' }}
                              >
                                {sig.typeProbleme.nom}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUTS_BADGE[sig.statut] || 'bg-gray-100 text-gray-700'}`}>
                              {sig.statut === 'actif' ? 'Actif' : 
                               sig.statut === 'en_cours' ? 'En cours' : 
                               sig.statut === 'resolu' ? 'Résolu' : 
                               sig.statut === 'rejete' ? 'Rejeté' : sig.statut}
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-900">{sig.titre || 'Sans titre'}</h5>
                          {sig.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{sig.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            {sig.adresse && (
                              <span><i className="fa fa-map-marker mr-1" />{sig.adresse}</span>
                            )}
                            <span><i className="fa fa-calendar mr-1" />{formatDate(sig.dateSignalement)}</span>
                            {sig.budget && (
                              <span className="text-indigo-600 font-medium">
                                <i className="fa fa-money mr-1" />{formatMoney(sig.budget)}
                              </span>
                            )}
                            {sig.surfaceM2 && (
                              <span><i className="fa fa-expand mr-1" />{sig.surfaceM2} m²</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer du modal */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}