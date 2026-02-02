import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import MapLeaflet from '../components/MapLeaflet.jsx'
import MapPage from '../pages/Map.jsx'
import Login from '../pages/Login.jsx'
import Inscription from '../pages/Inscription.jsx'
import Index from '../pages/Index.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import Utilisateurs from '../pages/dashboard/Utilisateurs.jsx'
import DeblocageComptes from '../pages/dashboard/DeblocageComptes.jsx'
import Entreprises from '../pages/dashboard/Entreprises.jsx'
import Signalements from '../pages/dashboard/Signalements.jsx'
import Statistiques from '../pages/dashboard/Statistiques.jsx'
import Parametres from '../pages/dashboard/Parametres.jsx'

function LoginRoute() {
  const navigate = useNavigate()
  return (
    <Login
      onGoRegister={() => navigate('/inscription')}
      onLoginSuccess={({ token, expiresAt, user }) => {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_expiresAt', String(expiresAt))
        const roleName = user?.role?.nom
        if (roleName) localStorage.setItem('auth_role', String(roleName))
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
    navigate('/login')
  }
  return <DashboardLayout onLogout={handleLogout} />
}

function ManagerOnlyRoute({ children }) {
  const role = localStorage.getItem('auth_role')
  if (role !== 'manager') return <Navigate to="/dashboard" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<IndexRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/inscription" element={<InscriptionRoute />} />

      <Route element={<DashboardLayoutRoute />}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/utilisateurs" element={<Utilisateurs />} />
        <Route
          path="/deblocage"
          element={
            <ManagerOnlyRoute>
              <DeblocageComptes />
            </ManagerOnlyRoute>
          }
        />
        <Route path="/entreprises" element={<Entreprises />} />
        <Route path="/signalements" element={<Signalements />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/parametres" element={<Parametres />} />
      </Route>

      <Route path="/map" element={<MapLeaflet />} />
      <Route path="/maplibre" element={<MapPage />} />
    </Routes>
  )
}