import { useState } from 'react'
import { fullBidirectionalSync } from '../api/client.js'

export default function SyncAllButton() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSync() {
    setLoading(true)
    setError('')
    setResult(null)
    setStep('Synchronisation complète en cours...')

    try {
      const data = await fullBidirectionalSync()
      setResult(data)
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
        <span>{loading ? step || 'Sync...' : 'Sync All'}</span>
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
            <div className="mt-3 space-y-3 text-sm">
              {/* PUSH : PG → Firebase */}
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="font-medium text-emerald-700">
                  <i className="fa fa-cloud-upload mr-1" aria-hidden="true" />
                  Envoi PG → Firebase
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  ✓ {result.push?.totalCreated ?? 0} créé(s), {result.push?.totalUpdated ?? 0} mis à jour
                </p>
                {result.push?.details?.length > 0 && (
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-emerald-600">
                    {result.push.details.map((d, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="font-medium">{d.collection}</span>
                        <span>
                          {d.error
                            ? <span className="text-red-500">erreur</span>
                            : `${d.created} créé(s), ${d.updated} MAJ`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* PULL : Firebase → PG */}
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="font-medium text-blue-700">
                  <i className="fa fa-cloud-download mr-1" aria-hidden="true" />
                  Récupération Firebase → PG
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  ✓ {result.pull?.totalImported ?? 0} importé(s), {result.pull?.totalSkipped ?? 0} ignoré(s)
                </p>
                {result.pull?.details?.length > 0 && (
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-blue-600">
                    {result.pull.details.map((d, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="font-medium">{d.collection}</span>
                        <span>{d.imported} importé(s), {d.skipped} ignoré(s)</span>
                      </li>
                    ))}
                  </ul>
                )}
                {result.pull?.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-red-600">Erreurs :</p>
                    <ul className="mt-1 max-h-20 overflow-y-auto text-xs text-red-500">
                      {result.pull.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
