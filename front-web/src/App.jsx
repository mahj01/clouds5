import { useEffect, useState } from 'react'
import './App.css'
import Login from './pages/Login.jsx'
import Inscription from './pages/Inscription.jsx'
import Dashboard from './pages/Dashboard.jsx'

const TOKEN_KEY = 'auth_token'
const EXPIRES_KEY = 'auth_expiresAt'

function loadAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = localStorage.getItem(EXPIRES_KEY)
  if (!token || !expiresAt) return null
  const t = Date.parse(expiresAt)
  if (Number.isNaN(t) || t <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    return null
  }
  return { token, expiresAt }
}

function App() {
  // main page must be login when not authenticated
  const [auth, setAuth] = useState(null)
  const [view, setView] = useState('login') // 'login' | 'inscription'

  useEffect(() => {
    setAuth(loadAuth())
  }, [])

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    setAuth(null)
    setView('login')
  }

  if (auth) {
    return (
      <div className="container">
        <Dashboard onLogout={handleLogout} />
      </div>
    )
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <div className="card__actions">
          <button type="button" onClick={() => setPage('login')}>
            Se connecter
          </button>
        </div>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      {/* Bouton vers la carte */}
      <div className="card" style={{ marginTop: '20px' }}>
        <Link to="/map">
          <button style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Voir la carte
          </button>
        </Link>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
