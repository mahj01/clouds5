export const DASHBOARD_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa fa-bar-chart', path: '/dashboard' },
  { id: 'utilisateurs', label: 'Liste des Utilisateurs', icon: 'fa fa-users', path: '/utilisateurs', adminOnly: true },
  { id: 'entreprises', label: 'Entreprises', icon: 'fa fa-building', path: '/entreprises' },
  { id: 'signalements_liste', label: 'Liste des Signalements', icon: 'fa fa-exclamation-triangle', path: '/signalements', adminOnly: true },
  { id: 'signalements_creer', label: 'Créer un signalement', icon: 'fa fa-exclamation-triangle', path: '/signalements', adminOnly: true },
  { id: 'statistiques', label: 'Statistiques', icon: 'fa fa-line-chart', path: '/statistiques', adminOnly: true },
  { id: 'maplibre', label: 'MapLibre', icon: 'fa fa-line-chart', path: '/maplibre' },
  { id: 'parametres', label: 'Paramètres', icon: 'fa fa-cog', path: '/parametres', adminOnly: true },
  { id: 'signalements', label: 'Signalements', icon: 'fa fa-exclamation-triangle', path: '/signalements' },
  { id: 'problemes-routiers', label: 'Problèmes Routiers', icon: 'fa fa-road', path: '/problemes-routiers' },
  { id: 'statistiques', label: 'Statistiques', icon: 'fa fa-line-chart', path: '/statistiques' },
]