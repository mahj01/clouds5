export const DASHBOARD_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa fa-bar-chart', path: '/dashboard' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: 'fa fa-users', path: '/utilisateurs' },
  { id: 'deblocage', label: 'Déblocage', icon: 'fa fa-unlock-alt', path: '/deblocage', requiresRole: 'manager' },
  { id: 'entreprises', label: 'Entreprises', icon: 'fa fa-building', path: '/entreprises' },
  { id: 'signalements', label: 'Signalements', icon: 'fa fa-exclamation-triangle', path: '/signalements' },
  { id: 'statistiques', label: 'Statistiques', icon: 'fa fa-line-chart', path: '/statistiques' },
  { id: 'parametres', label: 'Paramètres', icon: 'fa fa-cog', path: '/parametres' },
]