import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import MapLeaflet from '../components/MapLeaflet.jsx'
import MapPage from '../pages/Map.jsx'
import Login from '../pages/Login.jsx'
import Inscription from '../pages/Inscription.jsx'
import Index from '../pages/Index.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import Utilisateurs from '../pages/dashboard/Utilisateurs.jsx'
import UtilisateursDeblocage from '../pages/dashboard/UtilisateursDeblocage.jsx'
import Entreprises from '../pages/dashboard/Entreprises.jsx'
import Signalements from '../pages/dashboard/Signalements.jsx'
import Statistiques from '../pages/dashboard/Statistiques.jsx'
import Parametres from '../pages/dashboard/Parametres.jsx'

function getStoredRoleName() {
  try {
    return localStorage.getItem('auth_role')
  } catch {
    return null
  }
}

function ManagerOnly({ children }) {
  const role = String(getStoredRoleName() || '').toLowerCase()
  if (role !== 'manager') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function LoginRoute() {
  const navigate = useNavigate()
  return (
    <Login
      onGoRegister={() => navigate('/inscription')}
      onLoginSuccess={({ token, expiresAt, roleName, userId }) => {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_expiresAt', String(expiresAt))
        if (roleName) localStorage.setItem('auth_role', String(roleName))
        if (userId) localStorage.setItem('auth_userId', String(userId))
        navigate('/dashboard')
      }}
    />
  )
}

function InscriptionRoute() {
  const navigate = useNavigate()
  return <Inscription onGoLogin={() => navigate('/login')} />
}

function IndexRoute() {
  const navigate = useNavigate()
  return <Index onGoLogin={() => navigate('/login')} onGoRegister={() => navigate('/inscription')} />
}

function DashboardLayoutRoute() {
  const navigate = useNavigate()
  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_expiresAt')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_userId')
    navigate('/login')
  }
  return <DashboardLayout onLogout={handleLogout} />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<IndexRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/inscription" element={<InscriptionRoute />} />

      <Route element={<DashboardLayoutRoute />}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/utilisateurs"
           element={(
            <ManagerOnly>
              <Utilisateurs />
            </ManagerOnly>
          )} />
        <Route
          path="/deblocage"
          element={(
            <ManagerOnly>
              <UtilisateursDeblocage />
            </ManagerOnly>
          )}
        />
        
        <Route path="/entreprises" element={<Entreprises />} />
        <Route
          path="/signalements"
          element={(
            <ManagerOnly>
              <Signalements />
            </ManagerOnly>
          )}
        />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/maplibre" element={<MapPage />} />
      </Route>

      <Route path="/map" element={<MapLeaflet />} />
    </Routes>
  )
}