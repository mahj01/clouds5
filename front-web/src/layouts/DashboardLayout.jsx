import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getNavItemsForRole, canEdit, isVisitor as checkIsVisitor } from '../constants/dashboardNav.js'
import SyncFirebaseButton from '../components/SyncFirebaseButton.jsx'

function getStoredRoleName() {
  try {
    return localStorage.getItem('auth_role')
  } catch {
    return null
  }
}

export default function DashboardLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const roleName = useMemo(() => String(getStoredRoleName() || '').toLowerCase() || 'visiteur', [])
  const navItems = useMemo(() => getNavItemsForRole(roleName), [roleName])
  const isAdmin = useMemo(() => canEdit(roleName), [roleName])
  const isVisitor = useMemo(() => checkIsVisitor(roleName), [roleName])

  const expiresAt = useMemo(() => localStorage.getItem('auth_expiresAt'), [])
  const expiresText = useMemo(() => {
    if (!expiresAt) return '—'
    const time = Date.parse(expiresAt)
    if (Number.isNaN(time)) return String(expiresAt)
    return new Date(time).toLocaleString()
  }, [expiresAt])

  function handleGoToLogin() {
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_expiresAt')
    localStorage.removeItem('auth_userId')
    navigate('/login')
  }

  return (
    <div className="relative flex min-h-screen bg-gray-50 text-slate-800">
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
        <span className="text-sm font-semibold text-slate-800">Clouds5</span>
        {isAdmin && <SyncFirebaseButton />}
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 border-r border-slate-200 bg-slate-100 px-5 py-6 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-indigo-600">Clouds5</div>
          {isVisitor && (
            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
              Visiteur
            </span>
          )}
        </div>

        <nav className="mt-6 space-y-2" aria-label="Navigation latérale">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`${item.icon} text-lg`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
          {isVisitor ? (
            /* Affichage pour visiteur */
            <>
              <p className="text-sm text-slate-500 mb-3">
                Vous naviguez en mode visiteur.
              </p>
              <button
                type="button"
                className="w-full rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
                onClick={handleGoToLogin}
              >
                <i className="fa fa-sign-in mr-2" />
                Se connecter
              </button>
              <button
                type="button"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                onClick={() => navigate('/inscription')}
              >
                <i className="fa fa-user-plus mr-2" />
                Créer un compte
              </button>
            </>
          ) : (
            /* Affichage pour utilisateur connecté */
            <>
              <div className="flex items-center justify-between">
                <span>Expiration</span>
                <span className="font-medium text-slate-800">{expiresText}</span>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                onClick={onLogout}
              >
                Se déconnecter
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 px-4 pb-10 pt-20 md:pt-6">
        {/* Header avec bouton Synchroniser en haut à droite */}
        {isAdmin && (
          <div className="mb-4 flex justify-end">
            <SyncFirebaseButton />
          </div>
        )}
        <div className="mx-auto h-full w-full max-w-7xl">
          <Outlet context={{ roleName, canEdit: isAdmin }} />
        </div>
      </main>
    </div>
  )
}