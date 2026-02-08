import { apiFetch } from './client.js'

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getNotifications(userId) {
  return apiFetch(`/notifications/user/${userId}`)
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount(userId) {
  const data = await apiFetch(`/notifications/user/${userId}/unread-count`)
  return data.count || 0
}

/**
 * Marque une notification comme lue
 */
export async function markAsRead(notificationId) {
  return apiFetch(`/notifications/${notificationId}/read`, {
    method: 'POST',
  })
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllAsRead(userId) {
  return apiFetch(`/notifications/user/${userId}/read-all`, {
    method: 'POST',
  })
}
