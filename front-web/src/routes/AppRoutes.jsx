import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import MapLeaflet from '../components/MapLeaflet.jsx'
import MapPage from '../pages/Map.jsx'
import Login from '../pages/Login.jsx'
import Inscription from '../pages/Inscription.jsx'
import Index from '../pages/Index.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import FrontOfficeLayout from '../layouts/FrontOfficeLayout.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import Utilisateurs from '../pages/dashboard/Utilisateurs.jsx'
import UtilisateursDeblocage from '../pages/dashboard/UtilisateursDeblocage.jsx'
import Entreprises from '../pages/dashboard/Entreprises.jsx'
import Signalements from '../pages/dashboard/Signalements.jsx'
import Statistiques from '../pages/dashboard/Statistiques.jsx'
import Parametres from '../pages/dashboard/Parametres.jsx'
import Journal from '../pages/dashboard/Journal.jsx'
import Sauvegarde from '../pages/dashboard/Sauvegarde.jsx'
import ValidationDonnees from '../pages/dashboard/ValidationDonnees.jsx'
import HistoriqueSignalements from '../pages/dashboard/HistoriqueSignalements.jsx'
import CarteProblemesFrontOffice from '../pages/frontoffice/CarteProblemesFrontOffice.jsx'
import SignalerProblemeFrontOffice from '../pages/frontoffice/SignalerProblemeFrontOffice.jsx'

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
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
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
    </div>
  )
}

function InscriptionRoute() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Inscription onGoLogin={() => navigate('/login')} />
    </div>
  )
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

      {/* Front-office - Pages publiques (pour visiteurs non connectés) */}
      <Route element={<FrontOfficeLayout />}>
        <Route path="/map" element={<MapLeaflet />} />
      </Route>

      {/* Back-office - Dashboard admin */}
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
        <Route path="/signalements" element={<Signalements />} />
        <Route path="/historique-signalements" element={<HistoriqueSignalements />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/maplibre" element={<MapPage />} />
        {/* Pages front-office accessibles depuis le dashboard */}
        <Route path="/carte-problemes" element={<CarteProblemesFrontOffice />} />
        <Route path="/signaler-probleme" element={<SignalerProblemeFrontOffice />} />
        {/* Nouvelles fonctionnalités admin */}
        <Route
          path="/journal"
          element={(
            <ManagerOnly>
              <Journal />
            </ManagerOnly>
          )}
        />
        <Route
          path="/sauvegarde"
          element={(
            <ManagerOnly>
              <Sauvegarde />
            </ManagerOnly>
          )}
        />
        <Route
          path="/validation"
          element={(
            <ManagerOnly>
              <ValidationDonnees />
            </ManagerOnly>
          )}
        />
      </Route>
    </Routes>
  )
}