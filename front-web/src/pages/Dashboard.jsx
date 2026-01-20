import { useMemo } from 'react'
import './dashboard.css'

export default function Dashboard({ onLogout }) {
  const expiresAt = useMemo(() => localStorage.getItem('auth_expiresAt'), [])
  const expiresText = useMemo(() => {
    if (!expiresAt) return '—'
    const time = Date.parse(expiresAt)
    if (Number.isNaN(time)) return String(expiresAt)
    return new Date(time).toLocaleString()
  }, [expiresAt])

  return (
    <div className="dash">
      <aside className="dash__side">
        <div className="dash__brand">Clouds5</div>

        <nav className="dash__nav" aria-label="Navigation latérale">
          <button type="button" className="dash__navItem is-active">Dashboard</button>
          <button type="button" className="dash__navItem" disabled>Profil</button>
          <button type="button" className="dash__navItem" disabled>Paramètres</button>
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
          <header className="dash__header">
            <h1>Dashboard</h1>
            <p>Bienvenue dans votre espace.</p>
          </header>

          <section className="dash__content">
            <p>Vous êtes connecté. Votre session est active.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
