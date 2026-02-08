// Rôles disponibles: 'visiteur', 'client', 'manager' (admin)
// roles: tableau des rôles autorisés à voir cet élément
// Si roles n'est pas défini, l'élément est visible pour tous les rôles connectés (sauf visiteur)
export const DASHBOARD_NAV_ITEMS = [
  // Dashboard - visible pour client et admin
  { id: 'dashboard', label: 'Dashboard', icon: 'fa fa-bar-chart', path: '/dashboard', roles: ['client', 'manager'] },
  
  // Admin seulement
  { id: 'utilisateurs', label: 'Liste des Utilisateurs', icon: 'fa fa-users', path: '/utilisateurs', adminOnly: true, roles: ['manager'] },
  { id: 'deblocage', label: 'Déblocage Comptes', icon: 'fa fa-unlock', path: '/deblocage', adminOnly: true, roles: ['manager'] },
  
  // Entreprises - visible pour tous (visiteur, client, admin)
  { id: 'entreprises', label: 'Entreprises', icon: 'fa fa-building', path: '/entreprises', roles: ['visiteur', 'client', 'manager'] },
  
  // Signalements - visible pour tous (visiteur: lecture seule, client: ses signalements, admin: tous)
  { id: 'signalements', label: 'Signalements', icon: 'fa fa-exclamation-triangle', path: '/signalements', roles: ['visiteur', 'client', 'manager'] },
  
  // Historique Signalements - visible pour tous
  { id: 'historique-signalements', label: 'Historique Signalements', icon: 'fa fa-history', path: '/historique-signalements', roles: ['visiteur', 'client', 'manager'] },
  
  // Statistiques - admin seulement
  { id: 'statistiques', label: 'Statistiques', icon: 'fa fa-line-chart', path: '/statistiques', adminOnly: true, roles: ['manager'] },
  
  // Carte Antananarivo - visible pour tous
  { id: 'maplibre', label: 'Carte Antananarivo', icon: 'fa fa-map', path: '/maplibre', roles: ['visiteur', 'client', 'manager'] },
  
  // Carte des Problèmes - visible pour tous
  { id: 'carte-problemes', label: 'Carte des Problèmes', icon: 'fa fa-map-marker', path: '/carte-problemes', roles: ['visiteur', 'client', 'manager'] },
  
  // Signaler un Problème - client et admin seulement
  { id: 'signaler-probleme', label: 'Signaler un Problème', icon: 'fa fa-plus-circle', path: '/signaler-probleme', roles: ['client', 'manager'] },
  
  // Admin seulement
  { id: 'parametres', label: 'Paramètres', icon: 'fa fa-cog', path: '/parametres', adminOnly: true, roles: ['manager'] },
  { id: 'journal', label: 'Journal des accès', icon: 'fa fa-history', path: '/journal', adminOnly: true, roles: ['manager'] },
  { id: 'sauvegarde', label: 'Sauvegarde données', icon: 'fa fa-database', path: '/sauvegarde', adminOnly: true, roles: ['manager'] },
  { id: 'validation', label: 'Validation données', icon: 'fa fa-check-circle', path: '/validation', adminOnly: true, roles: ['manager'] },
]

// Fonction utilitaire pour filtrer les éléments de navigation selon le rôle
export function getNavItemsForRole(roleName) {
  const role = String(roleName || '').toLowerCase() || 'visiteur'
  return DASHBOARD_NAV_ITEMS.filter(item => {
    if (item.roles && Array.isArray(item.roles)) {
      return item.roles.includes(role)
    }
    // Si pas de roles défini, visible seulement pour manager (admin)
    return role === 'manager'
  })
}

// Vérifie si l'utilisateur peut modifier/supprimer (admin seulement)
export function canEdit(roleName) {
  const role = String(roleName || '').toLowerCase()
  return role === 'manager'
}

// Vérifie si l'utilisateur peut créer/signaler (client et admin)
export function canCreate(roleName) {
  const role = String(roleName || '').toLowerCase()
  return role === 'client' || role === 'manager'
}

// Vérifie si l'utilisateur est un visiteur (lecture seule)
export function isVisitor(roleName) {
  const role = String(roleName || '').toLowerCase()
  return !role || role === 'visiteur' || role === ''
}