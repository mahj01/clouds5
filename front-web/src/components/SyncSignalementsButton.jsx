import { useState } from 'react'
import { syncSignalementsFromFirestore } from '../api/client.js'

export default function SyncSignalementsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSync() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await syncSignalementsFromFirestore()
      setResult(data)
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
        disabled={loading}
        className="relative flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-60"
        title="Récupérer les signalements créés depuis l'appli mobile (Firebase) dans la base locale"
      >
        <i className={`fa fa-cloud-download ${loading ? 'animate-pulse' : ''}`} aria-hidden="true" />
        <span>{loading ? 'Synchronisation...' : 'Sync Signalements Firebase'}</span>
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
              {result.imported} importé(s), {result.skipped} ignoré(s)
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
