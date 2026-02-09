import { useState } from 'react'
import { syncFirestoreData, syncSignalementsFromFirestore } from '../api/client.js'

export default function SyncSignalementsButton() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSync() {
    setLoading(true)
    setError('')
    setResult(null)

    const summary = { envoi: null, recuperation: null }

    try {
      // 1) Envoi : PG → Firebase
      setStep('Envoi vers Firebase...')
      const envoi = await syncFirestoreData()
      summary.envoi = { success: true, totalSent: envoi?.totalSent ?? 0, totalSkipped: envoi?.totalSkipped ?? 0 }
    } catch (err) {
      summary.envoi = { success: false, message: err instanceof Error ? err.message : 'Erreur envoi' }
    }

    try {
      // 2) Récupération : Firebase → PG
      setStep('Récupération depuis Firebase...')
      const data = await syncSignalementsFromFirestore()
      summary.recuperation = { success: true, ...data }
    } catch (err) {
      summary.recuperation = { success: false, message: err instanceof Error ? err.message : 'Erreur récupération' }
    }

    setStep('')
    setResult(summary)
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="relative flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-60"
        title="Synchroniser les données : envoi vers Firebase puis récupération des signalements mobiles"
      >
        <i className={`fa fa-refresh ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{loading ? step || 'Synchronisation...' : 'Sync Signalements'}</span>
      </button>

      {/* Popup de résultat */}
      {result && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Synchronisation terminée</span>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-3 text-sm">
            {/* Envoi */}
            <div className={`rounded-lg p-2 ${result.envoi?.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`font-medium ${result.envoi?.success ? 'text-emerald-700' : 'text-red-700'}`}>
                <i className={`fa ${result.envoi?.success ? 'fa-cloud-upload' : 'fa-times-circle'} mr-1`} aria-hidden="true" />
                Envoi vers Firebase
              </p>
              <p className={`mt-1 text-xs ${result.envoi?.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.envoi?.success
                  ? `✓ ${result.envoi.totalSent} envoyé(s), ${result.envoi.totalSkipped} déjà existant(s)`
                  : `✗ ${result.envoi?.message}`}
              </p>
            </div>

            {/* Récupération */}
            <div className={`rounded-lg p-2 ${result.recuperation?.success ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`font-medium ${result.recuperation?.success ? 'text-blue-700' : 'text-red-700'}`}>
                <i className={`fa ${result.recuperation?.success ? 'fa-cloud-download' : 'fa-times-circle'} mr-1`} aria-hidden="true" />
                Récupération depuis Firebase
              </p>
              {result.recuperation?.success ? (
                <p className="mt-1 text-xs text-blue-600">
                  ✓ {result.recuperation.imported} importé(s), {result.recuperation.skipped} ignoré(s)
                </p>
              ) : (
                <p className="mt-1 text-xs text-red-600">
                  ✗ {result.recuperation?.message}
                </p>
              )}
              {result.recuperation?.errors?.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs font-medium text-red-600">Erreurs :</p>
                  <ul className="mt-1 max-h-20 overflow-y-auto text-xs text-red-500">
                    {result.recuperation.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
