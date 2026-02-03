import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/carte-problemes', label: 'Carte des Problèmes', icon: 'fa-map-marker' },
  { path: '/signaler-probleme', label: 'Signaler', icon: 'fa-plus-circle' },
  { path: '/map', label: 'Carte Madagascar', icon: 'fa-map' },
]

export default function FrontOfficeLayout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isLoggedIn = !!localStorage.getItem('auth_token')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <i className="fa fa-road text-indigo-400 text-xl" />
            <span className="font-semibold text-white text-lg">Problèmes Routiers</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === item.path
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <i className={`fa ${item.icon} mr-2`} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <i className="fa fa-tachometer mr-2" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`fa ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900 px-4 py-4">
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <i className={`fa ${item.icon} mr-2`} />
                  {item.label}
                </Link>
              ))}
              <hr className="border-white/10 my-2" />
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium text-center"
                >
                  <i className="fa fa-tachometer mr-2" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-lg border border-white/10 text-white text-sm font-medium text-center"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/inscription"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium text-center"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              © 2026 Problèmes Routiers - Signalement et suivi des problèmes de voirie
            </div>
            <div className="flex gap-4 text-sm text-slate-400">
              <Link to="/carte-problemes" className="hover:text-white">Carte</Link>
              <Link to="/signaler-probleme" className="hover:text-white">Signaler</Link>
              <Link to="/login" className="hover:text-white">Connexion</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
