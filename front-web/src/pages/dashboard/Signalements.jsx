import { useEffect, useState } from 'react'
import { getSignalements, updateSignalement, deleteSignalement, resoudreSignalement, getEntreprises, getHistoriqueBySignalement } from '../../api/client.js'
import { getTypesProblemeActifs } from '../../api/problemes.js'

const STATUTS = [
  { value: 'actif', label: 'Actif', color: 'bg-red-100 text-red-700' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'resolu', label: 'Résolu', color: 'bg-green-100 text-green-700' },
  { value: 'rejete', label: 'Rejeté', color: 'bg-gray-100 text-gray-700' },
]

const PRIORITES = [
  { value: 1, label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 2, label: 'Important', color: 'bg-orange-100 text-orange-700' },
  { value: 3, label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function avancementFromStatut(statut) {
  switch (statut) {
    case 'en_cours': return 50
    case 'resolu': return 100
    case 'actif':
    case 'rejete':
    default: return 0
  }
}

function avancementColor(pct) {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-gray-300'
}

function formatMoney(amount) {
  if (!amount) return '—'
  return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(amount)
}

export default function Signalements() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [signalements, setSignalements] = useState([])
  const [types, setTypes] = useState([])
  const [entreprises, setEntreprises] = useState([])
  const [filtreStatut, setFiltreStatut] = useState(null)
  
  // Modals
  const [viewing, setViewing] = useState(null) // Modal lecture seule
  const [editing, setEditing] = useState(null) // Modal édition
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [historique, setHistorique] = useState([])
  const [loadingHistorique, setLoadingHistorique] = useState(false)

  // Stats
  const stats = {
    total: signalements.length,
    actifs: signalements.filter(s => s.statut === 'actif').length,
    enCours: signalements.filter(s => s.statut === 'en_cours').length,
    resolus: signalements.filter(s => s.statut === 'resolu').length,
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [sigs, typesData, entreprisesData] = await Promise.all([
        getSignalements(),
        getTypesProblemeActifs(),
        getEntreprises(),
      ])
      setSignalements(Array.isArray(sigs) ? sigs : [])
      setTypes(Array.isArray(typesData) ? typesData : [])
      setEntreprises(Array.isArray(entreprisesData) ? entreprisesData : [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filteredSignalements = filtreStatut
    ? signalements.filter(s => s.statut === filtreStatut)
    : signalements

  // Ouvrir modal Voir (lecture seule)
  async function openView(s) {
    setViewing(s)
    setEditing(null)
    setSuccess(null)
    setError(null)
    setHistorique([])
    setLoadingHistorique(true)
    try {
      const hist = await getHistoriqueBySignalement(s.id)
      setHistorique(Array.isArray(hist) ? hist : [])
    } catch (e) {
      console.error('Erreur chargement historique:', e)
    } finally {
      setLoadingHistorique(false)
    }
  }

  // Ouvrir modal Modifier
  function openEdit(s) {
    setEditing(s)
    setViewing(null)
    setSuccess(null)
    setError(null)
    setForm({
      titre: s?.titre ?? '',
      description: s?.description ?? '',
      statut: s?.statut ?? 'actif',
      priorite: s?.priorite ?? 1,
      adresse: s?.adresse ?? '',
      typeProblemeId: s?.typeProbleme?.id ?? '',
      surfaceM2: s?.surfaceM2 ?? '',
      budget: s?.budget ?? '',
      entrepriseId: s?.entreprise?.id ?? '',
    })
  }

  function closeModals() {
    setViewing(null)
    setEditing(null)
  }

  async function saveEdit() {
    if (!editing?.id) return
    setSaving(true)
    setError(null)
    try {
      await updateSignalement(editing.id, {
        titre: form.titre || null,
        description: form.description || null,
        statut: form.statut,
        priorite: parseInt(form.priorite),
        adresse: form.adresse || null,
        typeProblemeId: form.typeProblemeId ? parseInt(form.typeProblemeId) : null,
        surfaceM2: form.surfaceM2 ? parseFloat(form.surfaceM2) : null,
        budget: form.budget ? parseFloat(form.budget) : null,
        entrepriseId: form.entrepriseId ? parseInt(form.entrepriseId) : null,
        utilisateurId: parseInt(localStorage.getItem('auth_userId') || '1'),
      })
      setSuccess('Signalement mis à jour avec succès.')
      closeModals()
      await refresh()
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleResoudre(s) {
    if (!confirm(`Marquer "${s.titre}" comme résolu ?`)) return
    try {
      const userId = parseInt(localStorage.getItem('auth_userId') || '1')
      await resoudreSignalement(s.id, userId, 'Résolu depuis le dashboard')
      setSuccess('Signalement résolu.')
      await refresh()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  async function handlePrendreEnCharge(s) {
    try {
      const userId = parseInt(localStorage.getItem('auth_userId') || '1')
      await updateSignalement(s.id, { statut: 'en_cours', utilisateurId: userId })
      setSuccess('Signalement pris en charge.')
      await refresh()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  async function handleDelete(s) {
    if (!confirm(`Supprimer définitivement "${s.titre}" ?`)) return
    try {
      await deleteSignalement(s.id)
      setSuccess('Signalement supprimé.')
      await refresh()
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  function getStatutBadge(statut) {
    const s = STATUTS.find(st => st.value === statut) || STATUTS[0]
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
  }

  function getPrioriteBadge(priorite) {
    const p = PRIORITES.find(pr => pr.value === priorite) || PRIORITES[0]
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.color}`}>{p.label}</span>
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fa fa-exclamation-triangle mr-3 text-indigo-600" />
            Signalements
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les signalements de problèmes routiers
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-refresh'} mr-2`} />
          Rafraîchir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-700">{stats.actifs}</div>
          <div className="text-sm text-red-600">Actifs</div>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-yellow-700">{stats.enCours}</div>
          <div className="text-sm text-yellow-600">En cours</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-700">{stats.resolus}</div>
          <div className="text-sm text-green-600">Résolus</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltreStatut(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !filtreStatut ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({stats.total})
        </button>
        {STATUTS.map(s => (
          <button
            key={s.value}
            onClick={() => setFiltreStatut(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtreStatut === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <i className="fa fa-check-circle mr-2" />{success}
        </div>
      )}

      {/* Liste des signalements */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fa fa-spinner fa-spin mr-2" />Chargement...
          </div>
        ) : filteredSignalements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun signalement trouvé.
          </div>
        ) : (
          filteredSignalements.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Infos principales */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {s.typeProbleme && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: s.typeProbleme.couleur || '#6366f1' }}
                      >
                        {s.typeProbleme.nom}
                      </span>
                    )}
                    {getStatutBadge(s.statut)}
                    {getPrioriteBadge(s.priorite)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{s.titre || 'Sans titre'}</h3>
                  {s.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{s.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    {s.adresse && (
                      <span><i className="fa fa-map-marker mr-1" />{s.adresse}</span>
                    )}
                    <span><i className="fa fa-calendar mr-1" />{formatDate(s.dateSignalement)}</span>
                    {s.utilisateur && (
                      <span><i className="fa fa-user mr-1" />{s.utilisateur.nom || s.utilisateur.email}</span>
                    )}
                    {s.surfaceM2 && (
                      <span><i className="fa fa-expand mr-1" />{s.surfaceM2} m²</span>
                    )}
                    {s.budget && (
                      <span className="text-indigo-600 font-medium">
                        <i className="fa fa-money mr-1" />{formatMoney(s.budget)}
                      </span>
                    )}
                    {s.entreprise && (
                      <span className="text-purple-600 font-medium">
                        <i className="fa fa-building mr-1" />{s.entreprise.nom}
                      </span>
                    )}
                    {s.dateResolution && (
                      <span className="text-green-600">
                        <i className="fa fa-check mr-1" />Résolu le {formatDate(s.dateResolution)}
                      </span>
                    )}
                  </div>

                  {/* Barre d'avancement */}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-24">Avancement</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${avancementColor(s.avancement ?? avancementFromStatut(s.statut))}`}
                        style={{ width: `${s.avancement ?? avancementFromStatut(s.statut)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-10 text-right">
                      {s.avancement ?? avancementFromStatut(s.statut)}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openView(s)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Voir les détails"
                  >
                    <i className="fa fa-eye mr-1" />Voir
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
                    title="Modifier et fixer le budget"
                  >
                    <i className="fa fa-pencil mr-1" />Modifier
                  </button>
                  {s.statut === 'actif' && (
                    <button
                      onClick={() => handlePrendreEnCharge(s)}
                      className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
                    >
                      <i className="fa fa-play mr-1" />Prendre en charge
                    </button>
                  )}
                  {(s.statut === 'actif' || s.statut === 'en_cours') && (
                    <button
                      onClick={() => handleResoudre(s)}
                      className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100"
                    >
                      <i className="fa fa-check mr-1" />Résoudre
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(s)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                  >
                    <i className="fa fa-trash mr-1" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==================== MODAL VOIR (Lecture seule) ==================== */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails du signalement</h3>
                <p className="text-xs text-gray-500">ID: {viewing.id}</p>
              </div>
              <button
                onClick={closeModals}
                className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                <i className="fa fa-times" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {viewing.typeProbleme && (
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: viewing.typeProbleme.couleur || '#6366f1' }}
                >
                  {viewing.typeProbleme.nom}
                </span>
              )}
              {/* Statut actuel + date du statut */}
              {(() => {
                const s = STATUTS.find(st => st.value === viewing.statut) || STATUTS[0]
                // Date du statut = dernier changement historique, ou dateSignalement si aucun changement
                const dateStatut = historique.length > 0
                  ? historique[0].dateChangement   // historique trié DESC, le [0] = le plus récent
                  : viewing.dateSignalement
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.color}`}>
                    {s.label}
                    <span className="opacity-70">• {formatDate(dateStatut)}</span>
                  </span>
                )
              })()}
              {getPrioriteBadge(viewing.priorite)}
            </div>

            {/* Titre et description */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">{viewing.titre}</h4>
              {viewing.description && (
                <p className="mt-2 text-gray-600">{viewing.description}</p>
              )}
            </div>

            {/* Informations en grille */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Adresse</div>
                <div className="font-medium text-gray-900">{viewing.adresse || '—'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Date du signalement</div>
                <div className="font-medium text-gray-900">{formatDate(viewing.dateSignalement)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Latitude</div>
                <div className="font-medium text-gray-900">{viewing.latitude}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Longitude</div>
                <div className="font-medium text-gray-900">{viewing.longitude}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Signalé par</div>
                <div className="font-medium text-gray-900">
                  {viewing.utilisateur?.nom || viewing.utilisateur?.email || '—'}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Surface estimée</div>
                <div className="font-medium text-gray-900">
                  {viewing.surfaceM2 ? `${viewing.surfaceM2} m²` : '—'}
                </div>
              </div>
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                <div className="text-xs text-indigo-600 mb-1">Budget alloué</div>
                <div className="font-bold text-indigo-700 text-lg">
                  {viewing.budget ? formatMoney(viewing.budget) : 'Non défini'}
                </div>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                <div className="text-xs text-purple-600 mb-1">Entreprise assignée</div>
                <div className="font-bold text-purple-700">
                  {viewing.entreprise ? (
                    <><i className="fa fa-building mr-1" />{viewing.entreprise.nom}</>
                  ) : 'Non assignée'}
                </div>
              </div>
              {viewing.dateResolution && (
                <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                  <div className="text-xs text-green-600 mb-1">Date de résolution</div>
                  <div className="font-medium text-green-700">{formatDate(viewing.dateResolution)}</div>
                </div>
              )}
              {/* Date du statut actuel — toujours affichée */}
              {(() => {
                const s = STATUTS.find(st => st.value === viewing.statut) || STATUTS[0]
                const dateStatut = historique.length > 0
                  ? historique[0].dateChangement
                  : viewing.dateSignalement
                const colorMap = {
                  actif: 'bg-red-50 border-red-100 text-red-600 text-red-700',
                  en_cours: 'bg-yellow-50 border-yellow-100 text-yellow-600 text-yellow-700',
                  resolu: 'bg-green-50 border-green-100 text-green-600 text-green-700',
                  rejete: 'bg-gray-50 border-gray-200 text-gray-500 text-gray-700',
                }
                const colors = (colorMap[viewing.statut] || colorMap.actif).split(' ')
                return (
                  <div className={`rounded-xl border p-4 ${colors[0]} ${colors[1]}`}>
                    <div className={`text-xs mb-1 ${colors[2]}`}>
                      <i className="fa fa-clock-o mr-1" />Statut « {s.label} » depuis
                    </div>
                    <div className={`font-bold ${colors[3]}`}>{formatDate(dateStatut)}</div>
                  </div>
                )
              })()}
            </div>

            {/* Avancement */}
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Avancement</span>
                <span className="text-sm font-bold text-slate-800">
                  {viewing.avancement ?? avancementFromStatut(viewing.statut)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${avancementColor(viewing.avancement ?? avancementFromStatut(viewing.statut))}`}
                  style={{ width: `${viewing.avancement ?? avancementFromStatut(viewing.statut)}%` }}
                />
              </div>
            </div>

            {viewing.commentaireResolution && (
              <div className="mt-4 rounded-xl bg-green-50 border border-green-100 p-4">
                <div className="text-xs text-green-600 mb-1">Commentaire de résolution</div>
                <div className="text-green-800">{viewing.commentaireResolution}</div>
              </div>
            )}

            {/* Historique des changements de statut */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                <i className="fa fa-history mr-2 text-indigo-500" />
                Historique des changements de statut
              </h4>
              {loadingHistorique ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  <i className="fa fa-spinner fa-spin mr-2" />Chargement...
                </div>
              ) : (() => {
                // Construire la timeline complète : création + changements
                const timeline = []

                // 1) Point de départ : création du signalement
                const statutInitial = historique.length > 0
                  ? historique[historique.length - 1].ancienStatut  // le plus ancien changement → son ancien statut = statut initial
                  : viewing.statut // pas de changement → statut actuel = statut initial
                timeline.push({
                  type: 'creation',
                  statut: statutInitial,
                  date: viewing.dateSignalement,
                  label: 'Signalement créé',
                  manager: viewing.utilisateur,
                })

                // 2) Tous les changements de statut (du plus ancien au plus récent)
                const sorted = [...historique].reverse()
                sorted.forEach(h => {
                  timeline.push({
                    type: 'changement',
                    ancienStatut: h.ancienStatut,
                    statut: h.nouveauStatut,
                    date: h.dateChangement,
                    label: null,
                    manager: h.manager,
                  })
                })

                return (
                  <div className="relative pl-6 space-y-0">
                    {/* Ligne verticale */}
                    <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
                    {timeline.map((entry, i) => {
                      const statutObj = STATUTS.find(s => s.value === entry.statut)
                      const isLast = i === timeline.length - 1
                      const dotColor = isLast ? 'bg-indigo-500' : 'bg-gray-400'

                      return (
                        <div key={i} className="relative pb-4 last:pb-0">
                          {/* Point */}
                          <div className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm ${dotColor} flex items-center justify-center`}>
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className={`rounded-xl border p-3 ${isLast ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-sm">
                                {entry.type === 'creation' ? (
                                  <>
                                    <i className="fa fa-plus-circle text-green-500 text-xs" />
                                    <span className="text-gray-600 text-xs font-medium">Créé</span>
                                    <i className="fa fa-arrow-right text-gray-300 text-xs" />
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statutObj?.color || 'bg-gray-100 text-gray-600'}`}>
                                      {statutObj?.label || entry.statut || '—'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUTS.find(s => s.value === entry.ancienStatut)?.color || 'bg-gray-100 text-gray-600'}`}>
                                      {STATUTS.find(s => s.value === entry.ancienStatut)?.label || entry.ancienStatut || '—'}
                                    </span>
                                    <i className="fa fa-arrow-right text-gray-300 text-xs" />
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statutObj?.color || 'bg-gray-100 text-gray-600'}`}>
                                      {statutObj?.label || entry.statut || '—'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                <i className="fa fa-clock-o mr-1" />
                                {formatDate(entry.date)}
                              </span>
                            </div>
                            {entry.manager && (
                              <div className="mt-1.5 text-xs text-gray-500">
                                <i className="fa fa-user mr-1" />
                                {entry.manager.nom || entry.manager.email || '—'}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Boutons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { closeModals(); openEdit(viewing); }}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <i className="fa fa-pencil mr-2" />Modifier
              </button>
              <button
                onClick={closeModals}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL MODIFIER ==================== */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <i className="fa fa-pencil mr-2 text-indigo-600" />
                  Modifier le signalement
                </h3>
                <p className="text-xs text-gray-500">ID: {editing.id}</p>
              </div>
              <button
                onClick={closeModals}
                disabled={saving}
                className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                <i className="fa fa-times" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm(f => ({ ...f, titre: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type de problème</label>
                <select
                  value={form.typeProblemeId}
                  onChange={(e) => setForm(f => ({ ...f, typeProblemeId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Aucun</option>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select
                  value={form.statut}
                  onChange={(e) => setForm(f => ({ ...f, statut: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {STATUTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
                <select
                  value={form.priorite}
                  onChange={(e) => setForm(f => ({ ...f, priorite: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {PRIORITES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm(f => ({ ...f, adresse: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <i className="fa fa-expand mr-1 text-indigo-500" />Surface (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.surfaceM2}
                  onChange={(e) => setForm(f => ({ ...f, surfaceM2: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Ex: 2.5"
                />
              </div>

              {/* Budget - Champ important pour le manager */}
              <div className="sm:col-span-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
                <label className="block text-sm font-semibold text-indigo-700 mb-2">
                  <i className="fa fa-money mr-2" />Budget alloué (MGA)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={form.budget}
                  onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))}
                  className="w-full rounded-xl border border-indigo-300 px-4 py-3 text-lg font-semibold focus:border-indigo-500 focus:outline-none"
                  placeholder="Ex: 500000"
                />
                <p className="text-xs text-indigo-600 mt-1">
                  Définissez le budget nécessaire pour résoudre ce problème
                </p>
              </div>

              {/* Assignation Entreprise */}
              <div className="sm:col-span-2 rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  <i className="fa fa-building mr-2" />Entreprise assignée
                </label>
                <select
                  value={form.entrepriseId}
                  onChange={(e) => setForm(f => ({ ...f, entrepriseId: e.target.value }))}
                  className="w-full rounded-xl border border-purple-300 px-4 py-3 text-sm font-medium focus:border-purple-500 focus:outline-none"
                >
                  <option value="">— Aucune entreprise —</option>
                  {entreprises.map(ent => (
                    <option key={ent.id} value={ent.id}>{ent.nom}</option>
                  ))}
                </select>
                <p className="text-xs text-purple-600 mt-1">
                  Assignez une entreprise pour la résolution de ce signalement
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Avancement auto-calculé */}
              <div className="sm:col-span-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    <i className="fa fa-tasks mr-2" />Avancement (auto-calculé)
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {avancementFromStatut(form.statut)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${avancementColor(avancementFromStatut(form.statut))}`}
                    style={{ width: `${avancementFromStatut(form.statut)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Nouveau/Actif = 0% · En cours = 50% · Résolu = 100%
                </p>
              </div>

              {/* Infos lecture seule */}
              <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div><strong>Latitude:</strong> {editing.latitude}</div>
                  <div><strong>Longitude:</strong> {editing.longitude}</div>
                  <div><strong>Signalé par:</strong> {editing.utilisateur?.email || '—'}</div>
                  <div><strong>Date:</strong> {formatDate(editing.dateSignalement)}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModals}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <><i className="fa fa-spinner fa-spin mr-2" />Enregistrement...</>
                ) : (
                  <><i className="fa fa-save mr-2" />Enregistrer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
