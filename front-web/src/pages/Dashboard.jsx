import { useMemo, useState } from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa fa-bar-chart' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: 'fa fa-users' },
  { id: 'entreprises', label: 'Entreprises', icon: 'fa fa-building' },
  { id: 'signalements', label: 'Signalements', icon: 'fa fa-exclamation-triangle' },
  { id: 'statistiques', label: 'Statistiques', icon: 'fa fa-line-chart' },
  { id: 'parametres', label: 'Paramètres', icon: 'fa fa-cog' },
]

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const expiresAt = useMemo(() => localStorage.getItem('auth_expiresAt'), [])
  const expiresText = useMemo(() => {
    if (!expiresAt) return '—'
    const time = Date.parse(expiresAt)
    if (Number.isNaN(time)) return String(expiresAt)
    return new Date(time).toLocaleString()
  }, [expiresAt])

  function handleNavClick(id) {
    setActiveTab(id)
    setSidebarOpen(false)
  }

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
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === item.id ? 'bg-indigo-500/20 text-indigo-100' : 'text-slate-300 hover:bg-white/5'}`}
              onClick={() => handleNavClick(item.id)}
            >
              <i className={`${item.icon} text-lg`} aria-hidden="true" />
              {item.label}
            </button>
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
          {activeTab === 'dashboard' && (
            <>
              <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
                <p className="mt-2 text-sm text-slate-300">
                  Bienvenue dans votre espace. Votre session est active.
                </p>
              </header>

              <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {NAV_ITEMS.filter((i) => i.id !== 'dashboard').map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                    onClick={() => setActiveTab(item.id)}
                  >
                      <i className={`${item.icon} text-lg`} aria-hidden="true" />
                    <span className="flex-1 px-3">{item.label}</span>
                    <i className="fa fa-angle-right text-base" aria-hidden="true" />
                  </button>
                ))}
              </section>
            </>
          )}

          {activeTab === 'utilisateurs' && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white"><i className="fa fa-users mr-2"/>Gestion des Utilisateurs</h2>
              <p className="mt-2 text-sm text-slate-300">Gérez les comptes utilisateurs, rôles et permissions.</p>
            </section>
          )}

          {activeTab === 'entreprises' && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white"><i className="fa fa-building mr-2"/>Gestion des Entreprises</h2>
              <p className="mt-2 text-sm text-slate-300">
                Cette section est en préparation. Ajoutez les composants Entreprises pour activer la gestion.
              </p>
            </section>
          )}

          {activeTab === 'signalements' && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white"><i className="fa fa-exclamation-triangle mr-2"/>Signalements</h2>
              <p className="mt-2 text-sm text-slate-300">
                Cette section est en préparation. Ajoutez les composants Signalements pour activer la gestion.
              </p>
            </section>
          )}

          {activeTab === 'statistiques' && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white"><i className="fa fa-line-chart mr-2"/>Statistiques</h2>
              <p className="mt-2 text-sm text-slate-300">Analysez les données et performances.</p>
            </section>
          )}

          {activeTab === 'parametres' && (
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white"><i className="fa fa-cog mr-2"/>Paramètres</h2>
              <p className="mt-2 text-sm text-slate-300">Configurez les options de votre compte.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
