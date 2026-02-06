import { useEffect, useState } from 'react'
import {
  getValidations,
  getValidationStatistiques,
  getSignalementsNonValides,
  validerSignalement,
  validerTousSignalementsAuto,
} from '../../api/client'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleString('fr-FR')
}

function StatutBadge({ statut }) {
  const styles = {
    valide: 'bg-green-100 text-green-700 border-green-200',
    en_attente: 'bg-amber-100 text-amber-700 border-amber-200',
    rejete: 'bg-red-100 text-red-700 border-red-200',
    a_corriger: 'bg-orange-100 text-orange-700 border-orange-200',
  }
  const labels = {
    valide: 'Validé',
    en_attente: 'En attente',
    rejete: 'Rejeté',
    a_corriger: 'À corriger',
  }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[statut] || styles.en_attente}`}>
      {labels[statut] || statut}
    </span>
  )
}

function CheckIcon({ ok }) {
  if (ok) {
    return <span className="text-green-500">✓</span>
  }
  return <span className="text-red-500">✗</span>
}

export default function ValidationDonnees() {
  const [validations, setValidations] = useState([])
  const [nonValides, setNonValides] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('validations')

  async function charger() {
    setLoading(true)
    setError(null)
    try {
      const [validationsRes, statsRes, nonValidesRes] = await Promise.all([
        getValidations(),
        getValidationStatistiques(),
        getSignalementsNonValides(),
      ])
      setValidations(Array.isArray(validationsRes) ? validationsRes : [])
      setStats(statsRes)
      setNonValides(Array.isArray(nonValidesRes) ? nonValidesRes : [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  async function handleValiderTous() {
    setProcessing(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await validerTousSignalementsAuto()
      setSuccess(`Validation automatique terminée: ${result.valides} valides, ${result.aVerifier} à vérifier, ${result.rejetes} rejetés`)
      charger()
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setProcessing(false)
    }
  }

  async function handleValider(signalementId, statut) {
    if (!signalementId) {
      setError('ID du signalement manquant')
      return
    }
    setError(null)
    setSuccess(null)
    try {
      const userId = localStorage.getItem('auth_userId')
      console.log('Validation en cours:', { signalementId, statut, userId })
      await validerSignalement(signalementId, {
        statut,
        validePar: userId ? parseInt(userId) : undefined,
      })
      setSuccess(`Signalement #${signalementId} ${statut === 'valide' ? 'validé' : 'rejeté'} avec succès`)
      charger()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Validation des données cartographiques</h1>
        <p className="text-sm text-slate-500">Vérifiez et validez les données des signalements</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Total</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">En attente</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{stats.enAttente}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Validés</div>
            <div className="mt-1 text-2xl font-bold text-green-600">{stats.valides}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Rejetés</div>
            <div className="mt-1 text-2xl font-bold text-red-600">{stats.rejetes}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Taux validation</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600">{stats.tauxValidation}%</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleValiderTous}
          disabled={processing}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          {processing ? 'Validation en cours…' : 'Valider automatiquement tous'}
        </button>
        <button
          onClick={charger}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Actualiser
        </button>
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

      {/* Onglets */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('validations')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'validations' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Validations ({validations.length})
        </button>
        <button
          onClick={() => setActiveTab('nonValides')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'nonValides' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Non validés ({nonValides.length})
        </button>
      </div>

      {/* Tableau des validations */}
      {activeTab === 'validations' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Signalement</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Coordonnées</th>
                  <th className="px-4 py-3">Complétude</th>
                  <th className="px-4 py-3">Cohérence</th>
                  <th className="px-4 py-3">Erreurs</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Validé par</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Chargement…
                    </td>
                  </tr>
                ) : validations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Aucune validation
                    </td>
                  </tr>
                ) : (
                  validations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          #{v.signalement?.id} - {v.signalement?.titre || '—'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {v.signalement?.latitude}, {v.signalement?.longitude}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatutBadge statut={v.statut} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckIcon ok={v.coordonneesValides} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckIcon ok={v.donneesCompletes} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckIcon ok={v.coherenceDonnees} />
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        {v.erreursDetectees ? (
                          <ul className="list-inside list-disc text-xs text-red-600">
                            {JSON.parse(v.erreursDetectees).map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-green-600">Aucune erreur</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(v.dateValidation)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.validePar?.nom || v.validePar?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {v.statut === 'valide' ? (
                          <span className="text-xs text-green-600 font-medium">✓ Validé</span>
                        ) : v.statut === 'rejete' ? (
                          <span className="text-xs text-red-600 font-medium">✗ Rejeté</span>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const signalementId = v.signalement?.id || v.signalementId
                                if (signalementId) handleValider(signalementId, 'valide')
                                else setError('ID du signalement non trouvé')
                              }}
                              className="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                const signalementId = v.signalement?.id || v.signalementId
                                if (signalementId) handleValider(signalementId, 'rejete')
                                else setError('ID du signalement non trouvé')
                              }}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                              title="Rejeter"
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau des non validés */}
      {activeTab === 'nonValides' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3">Coordonnées</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Surface</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Entreprise</th>
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
                ) : nonValides.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Tous les signalements ont été validés
                    </td>
                  </tr>
                ) : (
                  nonValides.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">#{s.id}</td>
                      <td className="px-4 py-3 text-slate-800">{s.titre || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.latitude}, {s.longitude}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.statut || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{s.surfaceM2 || '—'} m²</td>
                      <td className="px-4 py-3 text-slate-600">{s.budget || '—'} MGA</td>
                      <td className="px-4 py-3 text-slate-600">{s.entreprise?.nom || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleValider(s.id, 'valide')}
                            className="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => handleValider(s.id, 'rejete')}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          >
                            Rejeter
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
      )}
    </div>
  )
}
