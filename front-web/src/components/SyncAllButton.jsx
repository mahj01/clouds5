import { useState, useEffect } from 'react'
import { fullBidirectionalSync, getUnsyncedUsersCount } from '../api/client.js'

export default function SyncAllButton() {
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
    setStep('Synchronisation complète en cours...')

    try {
      const data = await fullBidirectionalSync()
      setResult(data)
      
      // Notifier les autres composants pour mettre à jour le badge
      try {
        const countData = await getUnsyncedUsersCount()
        const count = typeof countData?.count === 'number' ? countData.count : undefined
        window.dispatchEvent(new CustomEvent('users-updated', { detail: { count } }))
      } catch {
        window.dispatchEvent(new CustomEvent('users-updated'))
      }
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
        className="relative flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-indigo-600 disabled:opacity-60"
        title="Synchronisation complète bidirectionnelle de toutes les tables"
      >
        <i className={`fa fa-exchange ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{loading ? step || 'Sync...' : 'Synchroniser tout'}</span>
      </button>

      {/* Popup de résultat */}
      {(result || error) && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Synchronisation complète</span>
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
              Synchronisation tout effectuée
            </div>
          )}
        </div>
      )}
    </div>
  )
}
