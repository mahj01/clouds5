import { useId, useState } from 'react'
import './auth.css'

export default function Auth() {
  // Login state
  const loginEmailId = useId()
  const loginPasswordId = useId()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Register state
  const registerEmailId = useId()
  const registerPasswordId = useId()
  const registerNomId = useId()
  const registerPrenomId = useId()
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerNom, setRegisterNom] = useState('')
  const [registerPrenom, setRegisterPrenom] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // Panel state: 'login' or 'register'
  const [activePanel, setActivePanel] = useState('login')

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginSuccess(false)
    setLoginLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, motDePasse: loginPassword }),
      })

      if (!res.ok) {
        let message = `Erreur ${res.status}`
        try {
          const data = await res.json()
          if (data?.message) {
            message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
          }
        } catch { /* ignore */ }
        throw new Error(message)
      }

      setLoginSuccess(true)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegisterError('')
    setRegisterSuccess(false)
    setRegisterLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          motDePasse: registerPassword,
          nom: registerNom || undefined,
          prenom: registerPrenom || undefined,
        }),
      })

      if (!res.ok) {
        let message = `Erreur ${res.status}`
        try {
          const data = await res.json()
          if (data?.message) {
            message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
          }
        } catch { /* ignore */ }
        throw new Error(message)
      }

      setRegisterSuccess(true)
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className={`auth ${activePanel === 'register' ? 'auth--register-active' : ''}`}>
      {/* Formulaires */}
      <div className="auth__forms">
        {/* Login Form */}
        <div className="auth__form-container auth__form-container--login">
          <form className="auth__form" onSubmit={handleLogin}>
            <h1>Connexion</h1>
            <p className="auth__subtitle">Connectez-vous à votre compte</p>

            <div className="auth__field">
              <label htmlFor={loginEmailId}>Email</label>
              <input
                id={loginEmailId}
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth__field">
              <label htmlFor={loginPasswordId}>Mot de passe</label>
              <input
                id={loginPasswordId}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button className="auth__submit" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Connexion…' : 'Se connecter'}
            </button>

            {loginError && <p className="auth__message auth__message--error">{loginError}</p>}
            {loginSuccess && <p className="auth__message auth__message--success">Connexion réussie !</p>}
          </form>
        </div>

        {/* Register Form */}
        <div className="auth__form-container auth__form-container--register">
          <form className="auth__form" onSubmit={handleRegister}>
            <h1>Inscription</h1>
            <p className="auth__subtitle">Créez votre compte</p>

            <div className="auth__field">
              <label htmlFor={registerEmailId}>Email</label>
              <input
                id={registerEmailId}
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth__field">
              <label htmlFor={registerPasswordId}>Mot de passe</label>
              <input
                id={registerPasswordId}
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="auth__row">
              <div className="auth__field">
                <label htmlFor={registerNomId}>Nom</label>
                <input
                  id={registerNomId}
                  type="text"
                  value={registerNom}
                  onChange={(e) => setRegisterNom(e.target.value)}
                  placeholder="Nom"
                />
              </div>

              <div className="auth__field">
                <label htmlFor={registerPrenomId}>Prénom</label>
                <input
                  id={registerPrenomId}
                  type="text"
                  value={registerPrenom}
                  onChange={(e) => setRegisterPrenom(e.target.value)}
                  placeholder="Prénom"
                />
              </div>
            </div>

            <button className="auth__submit" type="submit" disabled={registerLoading}>
              {registerLoading ? 'Création…' : 'Créer mon compte'}
            </button>

            {registerError && <p className="auth__message auth__message--error">{registerError}</p>}
            {registerSuccess && <p className="auth__message auth__message--success">Compte créé avec succès !</p>}
          </form>
        </div>
      </div>

      {/* Overlay panels */}
      <div className="auth__overlay">
        <div className="auth__overlay-panel auth__overlay-panel--left">
          <h2>Déjà inscrit ?</h2>
          <p>Connectez-vous avec vos identifiants pour accéder à votre espace</p>
          <button
            className="auth__ghost-btn"
            type="button"
            onClick={() => setActivePanel('login')}
          >
            Se connecter
          </button>
        </div>
        <div className="auth__overlay-panel auth__overlay-panel--right">
          <h2>Pas encore de compte ?</h2>
          <p>Inscrivez-vous pour rejoindre notre communauté</p>
          <button
            className="auth__ghost-btn"
            type="button"
            onClick={() => setActivePanel('register')}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  )
}
