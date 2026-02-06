import { useEffect, useState } from 'react'
import {
  getSauvegardes,
  getSauvegardeStatistiques,
  creerSauvegarde,
  supprimerSauvegarde,
  telechargerSauvegarde,
} from '../../api/client'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleString('fr-FR')
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function StatutBadge({ statut }) {
  const styles = {
    termine: 'bg-green-100 text-green-700 border-green-200',
    en_cours: 'bg-blue-100 text-blue-700 border-blue-200',
    erreur: 'bg-red-100 text-red-700 border-red-200',
  }
  const labels = {
    termine: 'Terminé',
    en_cours: 'En cours',
    erreur: 'Erreur',
  }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[statut] || styles.en_cours}`}>
      {labels[statut] || statut}
    </span>
  )
}

export default function Sauvegarde() {
  const [sauvegardes, setSauvegardes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function charger() {
    setLoading(true)
    setError(null)
    try {
      const [list, statsRes] = await Promise.all([
        getSauvegardes(),
        getSauvegardeStatistiques(),
      ])
      setSauvegardes(Array.isArray(list) ? list : [])
      setStats(statsRes)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  async function handleCreer(type) {
    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      const userId = localStorage.getItem('auth_userId')
      await creerSauvegarde({
        type,
        utilisateurId: userId ? parseInt(userId) : undefined,
      })
      setSuccess(`Sauvegarde "${type}" lancée avec succès`)
      setTimeout(charger, 1000) // Recharger après 1s
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setCreating(false)
    }
  }

  async function handleSupprimer(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) return
    try {
      await supprimerSauvegarde(id)
      setSuccess('Sauvegarde supprimée')
      charger()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  async function handleTelecharger(id) {
    setError(null)
    setSuccess(null)
    try {
      const result = await telechargerSauvegarde(id)
      setSuccess(`Fichier "${result.fileName}" téléchargé avec succès`)
    } catch (e) {
      setError(e?.message || 'Erreur lors du téléchargement')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sauvegarde des données</h1>
        <p className="text-sm text-slate-500">Exportez les données cartographiques au format GeoJSON</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Total sauvegardes</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.totalSauvegardes}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Espace utilisé</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600">{formatSize(stats.tailleTotal)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-1">
            <div className="text-xs text-slate-500">Dernière sauvegarde</div>
            <div className="mt-1 text-sm font-medium text-slate-800">
              {stats.dernieresSauvegardes?.[0]
                ? formatDate(stats.dernieresSauvegardes[0].dateCreation)
                : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Actions de création */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-800">Créer une sauvegarde</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez le type de données à exporter au format GeoJSON
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => handleCreer('signalements')}
            disabled={creating}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Signalements'}
          </button>
          <button
            onClick={() => handleCreer('entreprises')}
            disabled={creating}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Entreprises'}
          </button>
          <button
            onClick={() => handleCreer('complete')}
            disabled={creating}
            className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Sauvegarde complète'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Liste des sauvegardes */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Historique des sauvegardes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Éléments</th>
                <th className="px-4 py-3">Taille</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Créé par</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Chargement…
                  </td>
                </tr>
              ) : sauvegardes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Aucune sauvegarde
                  </td>
                </tr>
              ) : (
                sauvegardes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.nom}</td>
                    <td className="px-4 py-3 text-slate-600">{s.type}</td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={s.statut} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.nombreElements || 0}</td>
                    <td className="px-4 py-3 text-slate-600">{formatSize(s.tailleFichier)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(s.dateCreation)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.creePar?.nom || s.creePar?.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {s.statut === 'termine' && (
                          <button
                            onClick={() => handleTelecharger(s.id)}
                            className="rounded-lg bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600"
                          >
                            Télécharger
                          </button>
                        )}
                        <button
                          onClick={() => handleSupprimer(s.id)}
                          className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
