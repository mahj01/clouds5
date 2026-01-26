import { useMemo, useState } from 'react'
import './dashboard.css'
import EntreprisesList from './EntreprisesList.jsx'
import EntrepriseCreate from './EntrepriseCreate.jsx'
import EntrepriseEdit from './EntrepriseEdit.jsx'
import SignalementsList from './SignalementsList.jsx'
import SignalementCreate from './SignalementCreate.jsx'
import SignalementEdit from './SignalementEdit.jsx'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: '👥' },
  { id: 'entreprises', label: 'Entreprises', icon: '🏢' },
  { id: 'signalements', label: 'Signalements', icon: '⚠️' },
  { id: 'statistiques', label: 'Statistiques', icon: '📈' },
  { id: 'parametres', label: 'Paramètres', icon: '⚙️' },
]

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [entrepriseView, setEntrepriseView] = useState('liste') // 'liste' | 'create' | 'edit'
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState(null)
  const [signalementView, setSignalementView] = useState('liste') // 'liste' | 'create' | 'edit'
  const [selectedSignalementId, setSelectedSignalementId] = useState(null)

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
    <div className="dash">
      {/* Mobile header */}
      <header className="dash__mobileHeader">
        <button
          type="button"
          className="dash__menuBtn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
        <span className="dash__mobileBrand">Clouds5</span>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="dash__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`dash__side ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="dash__brand">Clouds5</div>

        <nav className="dash__nav" aria-label="Navigation latérale">
          {NAV_ITEMS.map((item) => {
            if (item.id === 'entreprises' || item.id === 'signalements') {
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    className={`dash__navItem ${activeTab === item.id ? 'is-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="dash__navIcon">{item.icon}</span>
                    {item.label}
                  </button>

                  {activeTab === item.id && (
                    <div className="dash__subnav">
                      <button type="button" className={`dash__subItem ${(item.id === 'entreprises' ? entrepriseView : signalementView) === 'liste' ? 'is-active' : ''}`} onClick={() => {
                        if (item.id === 'entreprises') { setEntrepriseView('liste'); setSelectedEntrepriseId(null) } else { setSignalementView('liste'); setSelectedSignalementId(null) }
                      }}>
                        Liste
                      </button>
                      <button type="button" className={`dash__subItem ${(item.id === 'entreprises' ? entrepriseView : signalementView) === 'create' ? 'is-active' : ''}`} onClick={() => { if (item.id === 'entreprises') setEntrepriseView('create'); else setSignalementView('create') }}>
                        Création
                      </button>
                      <button type="button" className={`dash__subItem ${(item.id === 'entreprises' ? entrepriseView : signalementView) === 'edit' ? 'is-active' : ''}`} onClick={() => { if (item.id === 'entreprises') setEntrepriseView('edit'); else setSignalementView('edit') }} disabled={item.id === 'entreprises' ? !selectedEntrepriseId : !selectedSignalementId}>
                        Modification
                      </button>
                    </div>
                  )}
                </div>
              )
            }
            return (
              <button
                key={item.id}
                type="button"
                className={`dash__navItem ${activeTab === item.id ? 'is-active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="dash__navIcon">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="dash__meta">
          <div className="dash__metaRow">
            <span>Expiration</span>
            <span className="dash__metaValue">{expiresText}</span>
          </div>
          <button type="button" className="dash__logout" onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="dash__main">
        <div className="dash__mainInner">
          {activeTab === 'dashboard' && (
            <>
              <header className="dash__header">
                <h1>Dashboard</h1>
                <p>Bienvenue dans votre espace. Votre session est active.</p>
              </header>

              <section className="dash__cards">
                {NAV_ITEMS.filter((i) => i.id !== 'dashboard').map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="dash__card"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="dash__cardIcon">{item.icon}</span>
                    <span className="dash__cardLabel">{item.label}</span>
                    <span className="dash__cardArrow">→</span>
                  </button>
                ))}
              </section>
            </>
          )}

          {activeTab === 'utilisateurs' && (
            <section className="dash__page">
              <h2>👥 Gestion des Utilisateurs</h2>
              <p>Gérez les comptes utilisateurs, rôles et permissions.</p>
            </section>
          )}

          {activeTab === 'entreprises' && (
            <section className="dash__page">
              <h2>🏢 Gestion des Entreprises</h2>
              <div>
                {entrepriseView === 'liste' && (
                  <EntreprisesList onEdit={(id) => { setSelectedEntrepriseId(id); setEntrepriseView('edit') }} />
                )}

                {entrepriseView === 'create' && (
                  <EntrepriseCreate onCreated={() => { setEntrepriseView('liste') }} />
                )}

                {entrepriseView === 'edit' && (
                  <EntrepriseEdit id={selectedEntrepriseId} onSaved={() => { setEntrepriseView('liste'); setSelectedEntrepriseId(null) }} />
                )}
              </div>
            </section>
          )}

          {activeTab === 'signalements' && (
            <section className="dash__page">
              <h2>⚠️ Signalements</h2>
              <div>
                {signalementView === 'liste' && (
                  <SignalementsList onEdit={(id) => { setSelectedSignalementId(id); setSignalementView('edit') }} />
                )}

                {signalementView === 'create' && (
                  <SignalementCreate onCreated={() => { setSignalementView('liste') }} />
                )}

                {signalementView === 'edit' && (
                  <SignalementEdit id={selectedSignalementId} onSaved={() => { setSignalementView('liste'); setSelectedSignalementId(null) }} />
                )}
              </div>
            </section>
          )}

          {activeTab === 'statistiques' && (
            <section className="dash__page">
              <h2>📈 Statistiques</h2>
              <p>Analysez les données et performances.</p>
            </section>
          )}

          {activeTab === 'parametres' && (
            <section className="dash__page">
              <h2>⚙️ Paramètres</h2>
              <p>Configurez les options de votre compte.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
