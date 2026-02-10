import { Capacitor } from '@capacitor/core';
import { getToken } from './auth-storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper pour récupérer le token d'authentification
 * Essaie les deux méthodes de stockage
 */
async function getAuthToken(): Promise<string | null> {
  // Méthode 1: via auth-storage (auth.session JSON)
  const sessionToken = await getToken();
  console.log('[PushService] Token from auth.session:', sessionToken ? 'found' : 'null');
  if (sessionToken) return sessionToken;
  
  // Méthode 2: clé simple auth_token
  const simpleToken = localStorage.getItem('auth_token');
  console.log('[PushService] Token from auth_token:', simpleToken ? 'found' : 'null');
  if (simpleToken) return simpleToken;
  
  // Debug: afficher toutes les clés localStorage
  console.log('[PushService] localStorage keys:', Object.keys(localStorage));
  
  return null;
}

/**
 * Helper pour faire des requêtes authentifiées
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  console.log('[PushService] Token value:', token ? token.substring(0, 20) + '...' : 'null');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  console.log('[PushService] Request headers:', headers);
  return fetch(url, { ...options, headers });
}

// Import dynamique pour éviter l'erreur si le module n'est pas installé
let PushNotificationsPlugin: any = null;

async function loadPushNotificationsPlugin() {
  if (PushNotificationsPlugin) return PushNotificationsPlugin;
  try {
    // @ts-ignore - Module optionnel, peut ne pas être installé
    const module = await import('@capacitor/push-notifications');
    PushNotificationsPlugin = module.PushNotifications;
    return PushNotificationsPlugin;
  } catch {
    console.warn('[PushService] @capacitor/push-notifications non installé');
    return null;
  }
}

export interface PushNotificationData {
  notificationId?: string;
  signalementId?: string;
}

let currentFirebaseUid: string | null = null;

/**
 * Enregistre le FCM token auprès du backend
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  if (!currentFirebaseUid) {
    console.warn('[PushService] Pas d\'utilisateur connecté, token non envoyé');
    return;
  }

  try {
    const response = await authFetch(`${API_URL}/utilisateurs/firebase/${currentFirebaseUid}/fcm-token`, {
      method: 'PUT',
      body: JSON.stringify({ fcmToken: token }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('[PushService] Token FCM enregistré avec succès');
  } catch (error) {
    console.error('[PushService] Erreur envoi token FCM:', error);
  }
}

/**
 * Gestionnaire de réception de notification (app au premier plan)
 */
function handleNotificationReceived(notification: any): void {
  console.log('[PushService] Notification reçue:', notification);
  // La notification est affichée automatiquement par le système
  // On peut déclencher un événement custom ici si besoin
  window.dispatchEvent(new CustomEvent('push-notification-received', { 
    detail: { 
      title: notification.title,
      body: notification.body,
      data: notification.data as PushNotificationData,
    } 
  }));
}

/**
 * Gestionnaire de clic sur notification
 */
function handleNotificationActionPerformed(action: any): void {
  console.log('[PushService] Action sur notification:', action);
  const data = action.notification.data as PushNotificationData;
  
  if (data?.signalementId) {
    // Émettre un événement pour naviguer vers le signalement
    window.dispatchEvent(new CustomEvent('push-notification-tap', { 
      detail: { signalementId: data.signalementId } 
    }));
  }
}

/**
 * Initialise les notifications push (à appeler après login)
 */
export async function initPushNotifications(firebaseUid: string): Promise<void> {
  currentFirebaseUid = firebaseUid;

  // Push notifications non supportées sur web
  if (!Capacitor.isNativePlatform()) {
    console.log('[PushService] Plateforme non native, notifications push désactivées');
    return;
  }

  try {
    const PushNotifications = await loadPushNotificationsPlugin();
    if (!PushNotifications) {
      console.warn('[PushService] Plugin push non disponible');
      return;
    }

    // Demander la permission
    const permResult = await PushNotifications.requestPermissions();
    
    if (permResult.receive !== 'granted') {
      console.warn('[PushService] Permission notifications refusée');
      return;
    }

    // Enregistrer pour recevoir les notifications
    await PushNotifications.register();

    // Écouter les événements
    PushNotifications.addListener('registration', (token: any) => {
      console.log('[PushService] Token FCM reçu:', token.value);
      registerTokenWithBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[PushService] Erreur enregistrement push:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', handleNotificationReceived);

    PushNotifications.addListener('pushNotificationActionPerformed', handleNotificationActionPerformed);

    console.log('[PushService] Notifications push initialisées');
  } catch (error) {
    console.error('[PushService] Erreur init push notifications:', error);
  }
}

/**
 * Désactive les listeners push (à appeler au logout)
 */
export async function cleanupPushNotifications(): Promise<void> {
  currentFirebaseUid = null;
  
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const PushNotifications = await loadPushNotificationsPlugin();
    if (PushNotifications) {
      await PushNotifications.removeAllListeners();
      console.log('[PushService] Listeners push nettoyés');
    }
  } catch (error) {
    console.error('[PushService] Erreur cleanup push:', error);
  }
}

/**
 * Récupère le badge de notifications non lues
 */
export async function getUnreadCount(firebaseUid: string): Promise<number> {
  try {
    const response = await authFetch(`${API_URL}/notifications/firebase/${firebaseUid}/unread-count`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('[PushService] Erreur récupération badge:', error);
    return 0;
  }
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getNotifications(firebaseUid: string): Promise<any[]> {
  try {
    const response = await authFetch(`${API_URL}/notifications/firebase/${firebaseUid}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('[PushService] Notifications reçues:', data);
    return data;
  } catch (error) {
    console.error('[PushService] Erreur récupération notifications:', error);
    return [];
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationRead(notificationId: number): Promise<void> {
  try {
    await authFetch(`${API_URL}/notifications/${notificationId}/read`, { method: 'POST' });
  } catch (error) {
    console.error('[PushService] Erreur marquage lu:', error);
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsRead(firebaseUid: string): Promise<void> {
  try {
    await authFetch(`${API_URL}/notifications/firebase/${firebaseUid}/read-all`, { method: 'POST' });
  } catch (error) {
    console.error('[PushService] Erreur marquage tout lu:', error);
  }
}
