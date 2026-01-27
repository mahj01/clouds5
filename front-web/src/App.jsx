import { useEffect, useState } from 'react'
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
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
        <Dashboard onLogout={handleLogout} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      {view === 'login' && (
        <Login
          onGoRegister={() => setView('inscription')}
          onLoginSuccess={({ token, expiresAt }) => {
            localStorage.setItem(TOKEN_KEY, token)
            localStorage.setItem(EXPIRES_KEY, String(expiresAt))
            setAuth({ token, expiresAt: String(expiresAt) })
          }}
        />
      )}
      {view === 'inscription' && <Inscription onGoLogin={() => setView('login')} />}
    </div>
  )
}



export default App
