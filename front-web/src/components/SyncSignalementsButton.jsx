import { useState, useEffect } from 'react'
import { syncFirestoreData, syncSignalementsFromFirestore } from '../api/client.js'

export default function SyncSignalementsButton() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Auto-close popup after 3 seconds
  useEffect(() => {
    if (result || error) {
      const timer = setTimeout(() => {
        setResult(null)
        setError('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [result, error])

  async function handleSync() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // 1) Envoi : PG → Firebase
      setStep('Envoi vers Firebase...')
      await syncFirestoreData()

      // 2) Récupération : Firebase → PG
      setStep('Récupération depuis Firebase...')
      await syncSignalementsFromFirestore()

      setResult({ success: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation')
    } finally {
      setStep('')
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
        title="Synchroniser les signalements"
      >
        <i className={`fa fa-refresh ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{loading ? step || 'Synchronisation...' : 'Sync Signalements'}</span>
      </button>

      {/* Popup de résultat */}
      {(result || error) && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Résultat</span>
            <button
              type="button"
              onClick={() => { setResult(null); setError('') }}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <i className="fa fa-times-circle mr-1" aria-hidden="true" />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              <i className="fa fa-check-circle mr-2" aria-hidden="true" />
              Synchronisation signalements effectuée
            </div>
          )}
        </div>
      )}
    </div>
  )
}
