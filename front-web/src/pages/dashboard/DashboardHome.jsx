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
      <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">Bienvenue dans votre espace. Votre session est active.</p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <i className={`${item.icon} text-lg`} aria-hidden="true" />
            <span className="flex-1 px-3">{item.label}</span>
            <i className="fa fa-angle-right text-base" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </>
  )
}