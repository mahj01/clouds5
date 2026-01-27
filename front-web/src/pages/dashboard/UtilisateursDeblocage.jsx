import { useEffect, useMemo, useState } from 'react'
import {
  createHistoriqueStatusUtilisateur,
  getHistoriqueStatusUtilisateur,
  getStatutsCompte,
  getUtilisateurs,
  updateUtilisateur,
} from '../../api/client.js'

function normalizeStatusLabel(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

function pickLatestStatusEntry(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null
  return entries.reduce((best, cur) => {
    const bestId = Number(best?.id)
    const curId = Number(cur?.id)
    if (!Number.isFinite(bestId)) return cur
    if (!Number.isFinite(curId)) return best
    return curId > bestId ? cur : best
  }, entries[0])
}

export default function UtilisateursDeblocage() {
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [utilisateurs, setUtilisateurs] = useState([])
  const [historiques, setHistoriques] = useState([])
  const [statuts, setStatuts] = useState([])

  const [selectedActiveStatutId, setSelectedActiveStatutId] = useState('')

  async function refresh() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const [users, h, s] = await Promise.all([
        getUtilisateurs(),
        getHistoriqueStatusUtilisateur(),
        getStatutsCompte(),
      ])
      setUtilisateurs(Array.isArray(users) ? users : [])
      setHistoriques(Array.isArray(h) ? h : [])
      setStatuts(Array.isArray(s) ? s : [])
    } catch (e) {
      setError(e?.message ? String(e.message) : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const latestStatusByUserId = useMemo(() => {
    const map = new Map()
    for (const entry of Array.isArray(historiques) ? historiques : []) {
      const userId = entry?.utilisateur?.id
      if (!Number.isFinite(Number(userId))) continue
      const prev = map.get(Number(userId))
      if (!prev) {
        map.set(Number(userId), entry)
        continue
      }
      const chosen = pickLatestStatusEntry([prev, entry])
      map.set(Number(userId), chosen)
    }
    return map
  }, [historiques])

  const activeStatusCandidates = useMemo(() => {
    const list = Array.isArray(statuts) ? statuts : []
    const scored = list
      .map((s) => {
        const label = normalizeStatusLabel(s?.statut)
        const isActive =
          label === 'actif' ||
          label === 'active' ||
          label === 'activer' ||
          label === 'reactive' ||
          label === 'reactiver'
        return { item: s, isActive, label }
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return a.label.localeCompare(b.label)
      })

    return scored.map((x) => x.item)
  }, [statuts])

  useEffect(() => {
    if (selectedActiveStatutId) return
    const preferred = (Array.isArray(activeStatusCandidates) ? activeStatusCandidates : []).find((s) => {
      const label = normalizeStatusLabel(s?.statut)
      return label === 'actif' || label === 'active' || label === 'reactiver' || label === 'reactive'
    })
    if (preferred?.id) setSelectedActiveStatutId(String(preferred.id))
  }, [activeStatusCandidates, selectedActiveStatutId])

  const blockedUsers = useMemo(() => {
    const list = Array.isArray(utilisateurs) ? utilisateurs : []
    return list
      .map((u) => {
        const latest = latestStatusByUserId.get(Number(u?.id))
        const latestLabel = normalizeStatusLabel(latest?.statut?.statut)
        const isBlockedByHistory = latestLabel === 'bloque' || latestLabel === 'bloquer' || latestLabel === 'blocked'
        const isBlockedByDate = Boolean(u?.dateBlocage)
        return {
          user: u,
          latestStatus: latest,
          isBlocked: isBlockedByHistory || isBlockedByDate,
        }
      })
      .filter((x) => x.isBlocked)
  }, [utilisateurs, latestStatusByUserId])

  async function handleDebloquer(userId) {
    if (!userId) return
    setBusyId(userId)
    setError(null)
    setSuccess(null)

    try {
      // 1) Clear local blocking fields (best-effort)
      await updateUtilisateur(userId, {
        nbTentatives: 0,
        dateBlocage: null,
      })

      // 2) Add status history entry if we have a status to set
      const statutIdNum = Number(selectedActiveStatutId)
      if (Number.isFinite(statutIdNum) && statutIdNum > 0) {
        await createHistoriqueStatusUtilisateur({
          utilisateurId: Number(userId),
          statutCompteId: statutIdNum,
        })
      }

      setSuccess('Utilisateur débloqué.')
      await refresh()
    } catch (e) {
      setError(e?.message ? String(e.message) : String(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white"><i className="fa fa-unlock-alt mr-2"/>Déblocage utilisateurs</h2>
          <p className="mt-2 text-sm text-slate-300">
            Statut actuel = entrée la plus récente dans l’historique (id le plus grand).
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          onClick={refresh}
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
        <label className="text-sm font-medium text-slate-200">Statut à appliquer après déblocage (optionnel)</label>
        <select
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={selectedActiveStatutId}
          onChange={(e) => setSelectedActiveStatutId(e.target.value)}
        >
          <option value="">Ne pas créer d’historique</option>
          {(Array.isArray(statuts) ? statuts : []).map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.statut} (id: {s.id})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          Remarque: vos “statut_compte” doivent exister en base (ex: bloqué / activer / réactiver…).
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">Utilisateur</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Statut actuel</th>
              <th className="px-3 py-2">Date blocage</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-sm text-slate-300" colSpan={5}>Chargement…</td>
              </tr>
            ) : blockedUsers.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-sm text-slate-300" colSpan={5}>Aucun utilisateur bloqué détecté.</td>
              </tr>
            ) : (
              blockedUsers.map(({ user, latestStatus }) => {
                const statutLabel = latestStatus?.statut?.statut || '—'
                const busy = busyId === user.id
                return (
                  <tr key={user.id} className="rounded-2xl bg-white/5">
                    <td className="px-3 py-3 text-sm text-white">
                      {(user.prenom || '') + ' ' + (user.nom || '')}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-200">{user.email}</td>
                    <td className="px-3 py-3 text-sm text-slate-200">{statutLabel}</td>
                    <td className="px-3 py-3 text-sm text-slate-200">
                      {user.dateBlocage ? new Date(user.dateBlocage).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="rounded-xl bg-indigo-500/70 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                        onClick={() => handleDebloquer(user.id)}
                        disabled={busy}
                      >
                        {busy ? 'Déblocage…' : 'Débloquer'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
