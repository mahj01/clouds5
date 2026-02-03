import { Link } from 'react-router-dom'
import { DASHBOARD_NAV_ITEMS } from '../../constants/dashboardNav.js'

function getStoredRoleName() {
  try {
    return localStorage.getItem('auth_role')
  } catch {
    return null
  }
}

export default function DashboardHome() {
  const roleName = String(getStoredRoleName() || '').toLowerCase()
  const navItems = (Array.isArray(DASHBOARD_NAV_ITEMS) ? DASHBOARD_NAV_ITEMS : [])
    .filter((i) => i.id !== 'dashboard')
    .filter((i) => {
      if (roleName === 'manager') return true
      return !i?.adminOnly
    })

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Bienvenue dans votre espace. Votre session est active.</p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_NAV_ITEMS.filter((i) => i.id !== 'dashboard')
          .filter((i) => !i.requiresRole || i.requiresRole === role)
          .map((item) => (
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
          >
            <i className={`${item.icon} text-lg text-indigo-500`} aria-hidden="true" />
            <span className="flex-1 px-3">{item.label}</span>
            <i className="fa fa-angle-right text-base text-slate-400" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </>
  )
}