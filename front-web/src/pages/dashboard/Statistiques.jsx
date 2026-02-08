import { useEffect, useState } from 'react'
import { getSignalementsStatistiques } from '../../api/client.js'

function formatDelai(jours) {
  if (jours === null || jours === undefined) return '—'
  if (jours < 1) {
    const heures = Math.round(jours * 24)
    return heures <= 1 ? '< 1h' : `${heures}h`
  }
  if (jours < 2) {
    const h = Math.round(jours * 24)
    return `${h}h`
  }
  return `${jours}j`
}

export default function Statistiques() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    setError(null)
    try {
      const data = await getSignalementsStatistiques()
      setStats(data)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="text-center py-16 text-gray-400">
          <i className="fa fa-spinner fa-spin text-3xl mb-3" />
          <p className="text-sm">Chargement des statistiques…</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
        <button onClick={loadStats} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <i className="fa fa-refresh mr-2" />Réessayer
        </button>
      </section>
    )
  }

  if (!stats) return null

  const { total, parStatut, parType, delais, tauxResolution } = stats

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fa fa-line-chart mr-3 text-indigo-600" />
            Statistiques
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue d'ensemble des signalements et délais de traitement
          </p>
        </div>
        <button
          onClick={loadStats}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <i className="fa fa-refresh mr-2" />Rafraîchir
        </button>
      </div>

      {/* ==================== RÉPARTITION PAR STATUT ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard value={total} label="Total" icon="fa-list" bg="bg-white" border="border-gray-200" text="text-gray-900" />
        <StatCard value={parStatut.actifs} label="Actifs" icon="fa-exclamation-circle" bg="bg-red-50" border="border-red-200" text="text-red-700" />
        <StatCard value={parStatut.enCours} label="En cours" icon="fa-cogs" bg="bg-yellow-50" border="border-yellow-200" text="text-yellow-700" />
        <StatCard value={parStatut.resolus} label="Résolus" icon="fa-check-circle" bg="bg-green-50" border="border-green-200" text="text-green-700" />
        <StatCard value={parStatut.rejetes} label="Rejetés" icon="fa-ban" bg="bg-gray-50" border="border-gray-200" text="text-gray-600" />
      </div>

      {/* ==================== DÉLAIS DE TRAITEMENT ==================== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fa fa-clock-o mr-2 text-indigo-500" />
          Délais de traitement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <DelaiCard
            titre="Prise en charge"
            sousTitre="Actif → En cours"
            icon="fa-hand-paper-o"
            color="yellow"
            delai={delais?.priseEnCharge}
          />
          <DelaiCard
            titre="Traitement"
            sousTitre="En cours → Résolu"
            icon="fa-wrench"
            color="blue"
            delai={delais?.traitement}
          />
          <DelaiCard
            titre="Résolution totale"
            sousTitre="Signalement → Résolu"
            icon="fa-flag-checkered"
            color="green"
            delai={delais?.resolution}
          />
        </div>

        {/* Taux de résolution */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              <i className="fa fa-pie-chart mr-2 text-indigo-500" />
              Taux de résolution
            </span>
            <span className="text-lg font-bold text-indigo-700">{tauxResolution ?? 0}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${tauxResolution ?? 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {parStatut.resolus} signalement{parStatut.resolus > 1 ? 's' : ''} résolu{parStatut.resolus > 1 ? 's' : ''} sur {total} au total
          </p>
        </div>
      </div>

      {/* ==================== RÉPARTITION PAR TYPE ==================== */}
      {parType && parType.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fa fa-pie-chart mr-2 text-indigo-500" />
            Répartition par type de problème
          </h2>
          <div className="space-y-3">
            {parType.map((item, idx) => {
              const count = parseInt(item.count) || 0
              const percent = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.couleur || '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-900 font-medium truncate">{item.type || 'Non défini'}</span>
                      <span className="text-gray-500 flex-shrink-0 ml-2">{count} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: item.couleur || '#6b7280' }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== RÉPARTITION PAR STATUT (barres) ==================== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fa fa-bar-chart mr-2 text-indigo-500" />
          Répartition par statut
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Actifs', value: parStatut.actifs, color: '#ef4444' },
            { label: 'En cours', value: parStatut.enCours, color: '#eab308' },
            { label: 'Résolus', value: parStatut.resolus, color: '#22c55e' },
            { label: 'Rejetés', value: parStatut.rejetes, color: '#6b7280' },
          ].map((s, i) => {
            const percent = total > 0 ? Math.round((s.value / total) * 100) : 0
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 font-medium">{s.label}</span>
                    <span className="text-gray-500">{s.value} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ==================== COMPOSANTS UTILITAIRES ==================== */

function StatCard({ value, label, icon, bg, border, text }) {
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4 shadow-sm text-center`}>
      <div className={`text-2xl font-bold ${text}`}>
        <i className={`fa ${icon} mr-1 text-lg opacity-60`} />
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function DelaiCard({ titre, sousTitre, icon, color, delai }) {
  const colorMap = {
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', accent: 'text-yellow-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'text-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: 'text-green-600' },
  }
  const c = colorMap[color] || colorMap.blue
  const moyen = delai?.moyenJours
  const min = delai?.minJours
  const max = delai?.maxJours
  const nombre = delai?.nombre || 0

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <i className={`fa ${icon} ${c.accent}`} />
        <div>
          <div className={`text-sm font-semibold ${c.text}`}>{titre}</div>
          <div className="text-xs text-gray-400">{sousTitre}</div>
        </div>
      </div>
      <div className={`text-2xl font-bold ${c.text} mb-1`}>
        {moyen !== null && moyen !== undefined ? formatDelai(moyen) : '—'}
      </div>
      <div className="text-xs text-gray-500 space-y-0.5">
        <div className="flex justify-between">
          <span>Min</span>
          <span className="font-medium">{min !== null && min !== undefined ? formatDelai(min) : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Max</span>
          <span className="font-medium">{max !== null && max !== undefined ? formatDelai(max) : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Échantillon</span>
          <span className="font-medium">{nombre} signalement{nombre > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}