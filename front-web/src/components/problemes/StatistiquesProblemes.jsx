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
      <div className="text-center py-8 text-slate-400">
        <i className="fa fa-spinner fa-spin mr-2" /> Chargement des statistiques...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-3 text-red-300 text-sm">
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
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-3xl font-bold text-white">{total}</div>
          <div className="text-sm text-slate-400">Total</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{parStatut.actifs}</div>
          <div className="text-sm text-slate-400">Actifs</div>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{parStatut.enCours}</div>
          <div className="text-sm text-slate-400">En cours</div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{parStatut.resolus}</div>
          <div className="text-sm text-slate-400">Résolus</div>
        </div>
        <div className="rounded-xl border border-gray-500/20 bg-gray-500/10 p-4 text-center">
          <div className="text-3xl font-bold text-gray-400">{parStatut.rejetes}</div>
          <div className="text-sm text-slate-400">Rejetés</div>
        </div>
      </div>

      {/* Stats par type */}
      {parType && parType.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-medium text-white mb-4">
            <i className="fa fa-pie-chart mr-2" />
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
                      <span className="text-white">{item.type || 'Non défini'}</span>
                      <span className="text-slate-400">{item.count} ({percent}%)</span>
                    </div>
                    <div className="mt-1 h-2 bg-white/10 rounded-full overflow-hidden">
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
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-medium text-white mb-4">
            <i className="fa fa-check-circle mr-2" />
            Taux de résolution
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((parStatut.resolus / total) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {Math.round((parStatut.resolus / total) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
