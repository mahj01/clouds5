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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <i className="fa fa-road text-indigo-600 text-xl" />
            <span className="font-semibold text-gray-900 text-lg">Problèmes Routiers</span>
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
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
              <Link
                to="/login"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`fa ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4">
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className={`fa ${item.icon} mr-2`} />
                  {item.label}
                </Link>
              ))}
              <hr className="border-gray-200 my-2" />
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
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium text-center"
                >
                  Connexion
                </Link>
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
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © 2026 Problèmes Routiers - Signalement et suivi des problèmes de voirie
            </div>
            <div className="flex gap-4 text-sm text-gray-500">
              <Link to="/carte-problemes" className="hover:text-gray-900">Carte</Link>
              <Link to="/signaler-probleme" className="hover:text-gray-900">Signaler</Link>
              <Link to="/login" className="hover:text-gray-900">Connexion</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
