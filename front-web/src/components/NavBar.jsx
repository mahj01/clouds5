export default function NavBar({ page, onNavigate }) {
  return (
    <header className="topnav">
      <div className="topnav__inner">
        <button
          type="button"
          className="topnav__brand"
          onClick={() => onNavigate('home')}
          aria-label="Accueil"
        >
          Clouds5
        </button>

        <nav className="topnav__links" aria-label="Navigation">
          <button
            type="button"
            className={`topnav__link ${page === 'home' ? 'is-active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Accueil
          </button>
          <button
            type="button"
            className={`topnav__link ${page === 'login' ? 'is-active' : ''}`}
            onClick={() => onNavigate('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`topnav__link ${page === 'inscription' ? 'is-active' : ''}`}
            onClick={() => onNavigate('inscription')}
          >
            Inscription
          </button>
          <button
            type="button"
            className="topnav__link"
            onClick={async () => {
              try {
                const res = await fetch('http://localhost:3001/firestore/sync', { method: 'POST' });
                if (!res.ok) throw new Error('Sync failed');
                alert('Sync started / completed');
              } catch (e) {
                console.error(e);
                alert('Sync failed. See console for details.');
              }
            }}
          >
            Sync
          </button>
        </nav>
      </div>
    </header>
  )
}
