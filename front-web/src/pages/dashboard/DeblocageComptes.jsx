import { useEffect, useMemo, useState } from 'react'
import { listLockedUsers, unlockUser } from '../../api/client.js'

function formatDate(value) {
  if (!value) return '—'
  const t = Date.parse(String(value))
  if (Number.isNaN(t)) return String(value)
  return new Date(t).toLocaleString()
}

export default function DeblocageComptes() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [unlockingIds, setUnlockingIds] = useState(() => new Set())

  async function load() {
    setError('')
    setLoading(true)
    try {
      const data = await listLockedUsers()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lockedCount = useMemo(() => items.length, [items])

  async function handleUnlock(userId) {
    setError('')
    setUnlockingIds((prev) => new Set(prev).add(userId))
    try {
      await unlockUser(userId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setUnlockingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            <i className="fa fa-unlock-alt mr-2 text-indigo-500" aria-hidden="true" />
            Déblocage des comptes
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Comptes bloqués: <span className="font-semibold text-slate-800">{lockedCount}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
        >
          <i className="fa fa-refresh mr-2" aria-hidden="true" />
          {loading ? 'Chargement…' : 'Rafraîchir'}
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[600px] border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="border-b border-slate-200 px-3 py-3">ID</th>
              <th className="border-b border-slate-200 px-3 py-3">Email</th>
              <th className="border-b border-slate-200 px-3 py-3">Rôle</th>
              <th className="border-b border-slate-200 px-3 py-3">Tentatives</th>
              <th className="border-b border-slate-200 px-3 py-3">Bloqué le</th>
              <th className="border-b border-slate-200 px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td className="px-3 py-5 text-sm text-slate-500" colSpan={6}>
                  Aucun compte bloqué.
                </td>
              </tr>
            ) : (
              items.map((u) => {
                const isUnlocking = unlockingIds.has(u.id)
                return (
                  <tr key={u.id} className="text-sm text-slate-700 hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-3">{u.id}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{u.email}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{u?.role?.nom || '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{u.nbTentatives ?? '—'}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{formatDate(u.dateBlocage)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleUnlock(u.id)}
                        disabled={isUnlocking || loading}
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
                      >
                        <i className="fa fa-unlock mr-2" aria-hidden="true" />
                        {isUnlocking ? 'Déblocage…' : 'Débloquer'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Note: l’accès est limité au rôle <span className="font-semibold">manager</span>. Le déblocage remet les tentatives à 3.
      </p>
    </section>
  )
}
