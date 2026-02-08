import { Link, useOutletContext } from 'react-router-dom'
import { useMemo } from 'react'
import { getNavItemsForRole, isVisitor as checkIsVisitor } from '../../constants/dashboardNav.js'

export default function DashboardHome() {
  const outletContext = useOutletContext() || {}
  const roleName = outletContext.roleName || String(localStorage.getItem('auth_role') || '').toLowerCase() || 'visiteur'
  const isVisitor = useMemo(() => checkIsVisitor(roleName), [roleName])
  const navItems = useMemo(() => {
    return getNavItemsForRole(roleName).filter((i) => i.id !== 'dashboard')
  }, [roleName])

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">
          {isVisitor ? 'Bienvenue' : 'Dashboard'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isVisitor 
            ? 'Vous naviguez en mode visiteur. Connectez-vous pour accéder à plus de fonctionnalités.'
            : 'Bienvenue dans votre espace. Votre session est active.'
          }
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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