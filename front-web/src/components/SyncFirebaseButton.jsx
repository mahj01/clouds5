import { useEffect, useState, useCallback } from 'react'
import { syncUsersToFirebase, getUnsyncedUsersCount } from '../api/client.js'

export default function SyncFirebaseButton() {
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const fetchCount = useCallback(async () => {
    try {
      const data = await getUnsyncedUsersCount()
      setUnsyncedCount(data?.count ?? 0)
    } catch {
      // Ignorer les erreurs de comptage
    }
  }, [])

  useEffect(() => {
    fetchCount()
    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  async function handleSync() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await syncUsersToFirebase()
      setResult(data)
      // Rafraîchir le compteur après synchronisation
      await fetchCount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSync}
        disabled={false}
        className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
          unsyncedCount > 0
            ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md'
            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
        }`}
        title={unsyncedCount > 0 ? `${unsyncedCount} utilisateur(s) à synchroniser` : 'Tous les utilisateurs sont synchronisés'}
      >
        <i className={`fa fa-cloud-upload ${loading ? 'animate-pulse' : ''}`} aria-hidden="true" />
        <span>{loading ? 'Synchronisation...' : 'Synchroniser Firebase'}</span>
        
        {unsyncedCount > 0 && !loading && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unsyncedCount}
          </span>
        )}
      </button>

      {/* Popup de résultat */}
      {result && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Résultat</span>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-emerald-600">
              <i className="fa fa-check mr-1" aria-hidden="true" />
              {result.synced} synchronisé(s) sur {result.total}
            </p>
            {result.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-medium">Erreurs :</p>
                <ul className="mt-1 max-h-24 overflow-y-auto text-xs text-red-500">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup d'erreur */}
      {error && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-red-200 bg-red-50 p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
