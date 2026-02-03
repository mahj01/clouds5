import { useState, useEffect } from 'react'
import { getProblemesStatistiques } from '../../api/problemes.js'

export default function StatistiquesProblemes() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getProblemesStatistiques()
      setStats(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="fa fa-spinner fa-spin mr-2" /> Chargement des statistiques...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
        <i className="fa fa-exclamation-circle mr-2" />{error}
      </div>
    )
  }

  if (!stats) return null

  const { total, parStatut, parType } = stats

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-red-600">{parStatut.actifs}</div>
          <div className="text-sm text-gray-500">Actifs</div>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-yellow-600">{parStatut.enCours}</div>
          <div className="text-sm text-gray-500">En cours</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600">{parStatut.resolus}</div>
          <div className="text-sm text-gray-500">Résolus</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-600">{parStatut.rejetes}</div>
          <div className="text-sm text-gray-500">Rejetés</div>
        </div>
      </div>

      {/* Stats par type */}
      {parType && parType.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <i className="fa fa-pie-chart mr-2 text-indigo-600" />
            Répartition par type
          </h3>
          <div className="space-y-3">
            {parType.map((item, idx) => {
              const percent = total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.couleur || '#666' }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">{item.type || 'Non défini'}</span>
                      <span className="text-gray-500">{item.count} ({percent}%)</span>
                    </div>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: item.couleur || '#666',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Taux de résolution */}
      {total > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <i className="fa fa-check-circle mr-2 text-green-600" />
            Taux de résolution
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((parStatut.resolus / total) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((parStatut.resolus / total) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
