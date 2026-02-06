import { useEffect, useState, useMemo } from 'react'
import {
  getJournal,
  getJournalStatistiques,
} from '../../api/client'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleString('fr-FR')
}

function NiveauBadge({ niveau }) {
  const styles = {
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[niveau] || styles.info}`}>
      {niveau || 'info'}
    </span>
  )
}

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    action: '',
    niveau: '',
    dateDebut: '',
    dateFin: '',
  })

  async function charger() {
    setLoading(true)
    setError(null)
    try {
      const [journalRes, statsRes] = await Promise.all([
        getJournal(filter),
        getJournalStatistiques(),
      ])
      setEntries(journalRes?.data || [])
      setTotal(journalRes?.total || 0)
      setStats(statsRes)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilter(e) {
    e.preventDefault()
    charger()
  }

  const actionsUniques = useMemo(() => {
    if (!stats?.parAction) return []
    return stats.parAction.map(a => a.action)
  }, [stats])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Journal des accès</h1>
        <p className="text-sm text-slate-500">Historique de toutes les actions effectuées sur le système</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Total entrées</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.totalEntries}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Dernières 24h</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600">{stats.dernieres24h}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Types d'actions</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.parAction?.length || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Erreurs</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {stats.parNiveau?.find(n => n.niveau === 'error')?.count || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <form onSubmit={handleFilter} className="flex flex-col sm:flex-row flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <select
          className="w-full sm:w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
        >
          <option value="">Toutes les actions</option>
          {actionsUniques.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={filter.niveau}
          onChange={(e) => setFilter({ ...filter, niveau: e.target.value })}
        >
          <option value="">Tous les niveaux</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <input
          type="date"
          className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={filter.dateDebut}
          onChange={(e) => setFilter({ ...filter, dateDebut: e.target.value })}
          placeholder="Date début"
        />
        <input
          type="date"
          className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={filter.dateFin}
          onChange={(e) => setFilter({ ...filter, dateFin: e.target.value })}
          placeholder="Date fin"
        />
        <button
          type="submit"
          className="w-full sm:w-auto min-h-[36px] rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          Filtrer
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter({ action: '', niveau: '', dateDebut: '', dateFin: '' })
            setTimeout(charger, 0)
          }}
          className="w-full sm:w-auto min-h-[36px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Réinitialiser
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Mobile : cartes */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">Chargement…</div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">Aucune entrée</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">{e.action}</span>
                <NiveauBadge niveau={e.niveau} />
              </div>
              <div className="text-xs text-slate-500">{formatDate(e.dateAction)}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Ressource</span>
                  <p className="text-slate-700 truncate">{e.ressource || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Utilisateur</span>
                  <p className="text-slate-700 truncate">{e.utilisateur?.nom || e.utilisateur?.email || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">IP</span>
                  <p className="text-slate-600">{e.ip || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Détails</span>
                  <p className="text-slate-600 truncate" title={e.details}>{e.details || '—'}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {total > entries.length && (
          <div className="text-center text-xs text-slate-500 py-2">
            Affichage de {entries.length} sur {total} entrées
          </div>
        )}
      </div>

      {/* Desktop : tableau */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Ressource</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Niveau</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Chargement…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Aucune entrée
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(e.dateAction)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{e.action}</td>
                    <td className="px-4 py-3 text-slate-600">{e.ressource || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.utilisateur?.nom || e.utilisateur?.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <NiveauBadge niveau={e.niveau} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.ip || '—'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={e.details}>
                      {e.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > entries.length && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
            Affichage de {entries.length} sur {total} entrées
          </div>
        )}
      </div>
    </div>
  )
}
