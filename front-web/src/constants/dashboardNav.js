export const DASHBOARD_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa fa-bar-chart', path: '/dashboard' },
  { id: 'utilisateurs', label: 'Liste des Utilisateurs', icon: 'fa fa-users', path: '/utilisateurs', adminOnly: true },
  { id: 'ajouter-utilisateur', label: 'Ajouter un utilisateur', icon: 'fa fa-user-plus', path: '/inscription', adminOnly: true },
  { id: 'entreprises', label: 'Entreprises', icon: 'fa fa-building', path: '/entreprises' },
  { id: 'signalements', label: 'Signalements', icon: 'fa fa-exclamation-triangle', path: '/signalements' },
  { id: 'historique-signalements', label: 'Historique Signalements', icon: 'fa fa-history', path: '/historique-signalements' },
  { id: 'statistiques', label: 'Statistiques', icon: 'fa fa-line-chart', path: '/statistiques' },
  { id: 'maplibre', label: 'Carte Antananarivo', icon: 'fa fa-map', path: '/maplibre' },
  // Pages Front-Office accessibles depuis le dashboard
  { id: 'tableau-synthese', label: 'Tableau Synthèse', icon: 'fa fa-th-list', path: '/tableau-synthese' },
  { id: 'carte-problemes', label: 'Carte des Problèmes', icon: 'fa fa-map-marker', path: '/carte-problemes' },
  { id: 'signaler-probleme', label: 'Signaler un Problème', icon: 'fa fa-plus-circle', path: '/signaler-probleme' },
  { id: 'journal', label: 'Journal des accès', icon: 'fa fa-history', path: '/journal', adminOnly: true },
  { id: 'sauvegarde', label: 'Sauvegarde données', icon: 'fa fa-database', path: '/sauvegarde', adminOnly: true },
  { id: 'validation', label: 'Validation données', icon: 'fa fa-check-circle', path: '/validation', adminOnly: true },
  { id: 'niveaux-reparation', label: 'Niveaux Réparation', icon: 'fa fa-wrench', path: '/niveaux-reparation', adminOnly: true },
  { id: 'prix-forfaitaire', label: 'Prix Forfaitaire m²', icon: 'fa fa-money', path: '/prix-forfaitaire', adminOnly: true },
]

// Utility exports for role-based UI
export function getNavItemsForRole(roleName) {
  const role = String(roleName || '').toLowerCase() || 'visiteur'
  if (role === 'manager') return DASHBOARD_NAV_ITEMS
  return DASHBOARD_NAV_ITEMS.filter((item) => !item?.adminOnly)
}

export function canEdit(roleName) {
  return String(roleName || '').toLowerCase() === 'manager'
}

export function isVisitor(roleName) {
  const role = String(roleName || '').toLowerCase()
  return !role || role === 'visiteur' || role === ''
}