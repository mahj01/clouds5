import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './pages/Login.jsx'
import Inscription from './pages/Inscription.jsx'

function App() {
  const [count, setCount] = useState(0)
  const [page, setPage] = useState('home')

  if (page === 'login') {
    return (
      <>
        <div className="nav">
          <button className="nav__btn" type="button" onClick={() => setPage('home')}>
            Retour
          </button>
        </div>
        <Login onGoRegister={() => setPage('inscription')} />
      </>
    )
  }

  if (page === 'inscription') {
    return (
      <>
        <div className="nav">
          <button className="nav__btn" type="button" onClick={() => setPage('home')}>
            Retour
          </button>
        </div>
        <Inscription />
      </>
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
