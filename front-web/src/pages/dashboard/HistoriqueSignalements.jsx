import { useEffect, useState } from 'react'
import { getAllHistoriqueSignalements } from '../../api/client.js'

const STATUTS = [
  { value: 'actif', label: 'Actif', color: 'bg-red-100 text-red-700' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'resolu', label: 'Résolu', color: 'bg-green-100 text-green-700' },
  { value: 'rejete', label: 'Rejeté', color: 'bg-gray-100 text-gray-700' },
]

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

function getStatutBadge(statut) {
  const s = STATUTS.find(st => st.value === statut) || { label: statut || '—', color: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
}

export default function HistoriqueSignalements() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historiques, setHistoriques] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllHistoriqueSignalements()
      setHistoriques(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const filtered = search.trim()
    ? historiques.filter(h => {
        const q = search.toLowerCase()
        return (
          (h.signalement?.titre || '').toLowerCase().includes(q) ||
          (h.signalement?.adresse || '').toLowerCase().includes(q) ||
          (h.manager?.nom || '').toLowerCase().includes(q) ||
          (h.manager?.email || '').toLowerCase().includes(q) ||
          (h.ancienStatut || '').toLowerCase().includes(q) ||
          (h.nouveauStatut || '').toLowerCase().includes(q) ||
          String(h.signalement?.id || '').includes(q)
        )
      })
    : historiques

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fa fa-history mr-3 text-indigo-600" />
            Historique des Signalements
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tous les changements de statut des signalements
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="w-full sm:w-auto min-h-[36px] rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-refresh'} mr-2`} />
          Rafraîchir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{historiques.length}</div>
          <div className="text-sm text-gray-500">Total modifications</div>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold text-yellow-700">
            {historiques.filter(h => h.nouveauStatut === 'en_cours').length}
          </div>
          <div className="text-sm text-yellow-600">Prises en charge</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold text-green-700">
            {historiques.filter(h => h.nouveauStatut === 'resolu').length}
          </div>
          <div className="text-sm text-green-600">Résolutions</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold text-red-700">
            {historiques.filter(h => h.nouveauStatut === 'rejete').length}
          </div>
          <div className="text-sm text-red-600">Rejets</div>
        </div>
      </div>

      {/* Recherche */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par signalement, statut, manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}

      {/* Tableau */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fa fa-spinner fa-spin mr-2" />Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">
            <i className="fa fa-info-circle mr-2" />
            {search ? 'Aucun résultat pour cette recherche.' : 'Aucun historique enregistré.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Signalement</th>
                  <th className="px-5 py-3">Ancien statut</th>
                  <th className="px-3 py-3"></th>
                  <th className="px-5 py-3">Nouveau statut</th>
                  <th className="px-5 py-3">Modifié par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((h, i) => (
                  <tr key={h.id || i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(h.dateChangement)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        #{h.signalement?.id} — {h.signalement?.titre || 'Sans titre'}
                      </div>
                      {h.signalement?.adresse && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          <i className="fa fa-map-marker mr-1" />{h.signalement.adresse}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {getStatutBadge(h.ancienStatut)}
                    </td>
                    <td className="px-1 py-3 text-center text-gray-300">
                      <i className="fa fa-arrow-right" />
                    </td>
                    <td className="px-5 py-3">
                      {getStatutBadge(h.nouveauStatut)}
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {h.manager ? (
                        <span>
                          <i className="fa fa-user mr-1 text-gray-400" />
                          {h.manager.nom || h.manager.email || '—'}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Compteur résultats */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 text-xs text-gray-500">
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
            {search && ` (sur ${historiques.length} au total)`}
          </div>
        )}
      </div>
    </section>
  )
}
