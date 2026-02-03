import { useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { DASHBOARD_NAV_ITEMS } from '../constants/dashboardNav.js'

function getStoredRoleName() {
  try {
    return localStorage.getItem('auth_role')
  } catch {
    return null
  }
}

export default function DashboardLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const roleName = useMemo(() => String(getStoredRoleName() || '').toLowerCase(), [])
  const navItems = useMemo(() => {
    const items = Array.isArray(DASHBOARD_NAV_ITEMS) ? DASHBOARD_NAV_ITEMS : []
    if (roleName === 'manager') return items
    return items.filter((i) => !i?.adminOnly)
  }, [roleName])

  const expiresAt = useMemo(() => localStorage.getItem('auth_expiresAt'), [])
  const expiresText = useMemo(() => {
    if (!expiresAt) return '—'
    const time = Date.parse(expiresAt)
    if (Number.isNaN(time)) return String(expiresAt)
    return new Date(time).toLocaleString()
  }, [expiresAt])

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100">
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
        <span className="text-sm font-semibold text-white">Clouds5</span>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 border-r border-white/10 bg-slate-950/95 px-5 py-6 transition-transform md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="text-lg font-semibold text-white">Clouds5</div>

        <nav className="mt-6 space-y-2" aria-label="Navigation latérale">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-500/20 text-indigo-100' : 'text-slate-300 hover:bg-white/5'}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`${item.icon} text-lg`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span>Expiration</span>
            <span className="font-medium text-slate-100">{expiresText}</span>
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            onClick={onLogout}
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 pb-10 pt-20 md:pt-10">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}