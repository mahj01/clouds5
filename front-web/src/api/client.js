function getApiBase() {
  const fromEnv = import.meta?.env?.VITE_API_URL
  if (fromEnv) return String(fromEnv).replace(/\/+$/, '')

  // Default: same host as the frontend, backend on port 3001.
  // This fixes cases where the app is opened via LAN IP (not localhost).
  if (typeof window !== 'undefined' && window?.location) {
    const { protocol, hostname } = window.location
    if (protocol && hostname) return `${protocol}//${hostname}:3001`
  }

  return 'http://localhost:3001'
}

const API_BASE = getApiBase()

async function parseError(res) {
  let message = `Erreur ${res.status}`
  let remainingAttempts
  let isLocked
  try {
    const data = await res.json()
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
    }
    if (typeof data?.remainingAttempts === 'number') remainingAttempts = data.remainingAttempts
    if (typeof data?.isLocked === 'boolean') isLocked = data.isLocked
  } catch {
    // ignore JSON parse errors
  }

  if (typeof remainingAttempts === 'number') {
    if (isLocked) {
      // message already set by API, keep it (but ensure clarity)
      if (!String(message).toLowerCase().includes('bloqu')) {
          message = `${message} Compte bloqué. Contactez un manager.`
      }
    } else {
      const plural = remainingAttempts > 1 ? 's' : ''
      message = `${message} Il vous reste ${remainingAttempts} tentative${plural}.`
    }
  }
  throw new Error(message)
}

export async function apiFetch(path, options = {}) {
  let res
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
  const extraHeaders = { ...(options.headers || {}) }
  if (storedToken && !extraHeaders.Authorization && !extraHeaders.authorization) {
    extraHeaders.Authorization = `Bearer ${storedToken}`
  }
  
  // Séparer les headers des autres options pour éviter l'écrasement
  const { headers: _ignoredHeaders, ...restOptions } = options
  
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...restOptions,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    })
  } catch (e) {
    // Network / offline / DNS / CORS errors
    throw new Error('Impossible de contacter le serveur (hors ligne ?).')
  }

  if (!res.ok) {
    await parseError(res)
  }

  if (res.status === 204) return null

  try {
    return await res.json()
  } catch {
    return null
  }
}

export function getRoles() {
  return apiFetch('/roles')
}

export function registerUser(payload) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginUser(payload) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginVisitor() {
  return apiFetch('/auth/visiteur', { method: 'POST' })
}

export function getAuthToken() {
  try {
    return localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function listLockedUsers() {
  return apiFetch('/utilisateurs/locked', {
    headers: authHeaders(),
  })
}

export function unlockUser(id) {
  return apiFetch(`/utilisateurs/unlock/${id}`, {
    method: 'POST',
    headers: authHeaders(),
  })
}

export function lockUser(id) {
  return apiFetch(`/utilisateurs/lock/${id}`, {
    method: 'POST',
    headers: authHeaders(),
  })
}

export function createUtilisateur(payload) {
  return apiFetch('/utilisateurs', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function getSignalements() {
  return apiFetch('/signalements', {
    headers: authHeaders(),
  })
}

export function getSignalementsActifs() {
  return apiFetch('/signalements/actifs', {
    headers: authHeaders(),
  })
}

export function getSignalementsByStatut(statut) {
  return apiFetch(`/signalements/statut/${statut}`, {
    headers: authHeaders(),
  })
}

export function getSignalementsGeoJSON(statut = null) {
  const query = statut ? `?statut=${statut}` : ''
  return apiFetch(`/signalements/geojson${query}`, {
    headers: authHeaders(),
  })
}

export function getSignalementsStatistiques() {
  return apiFetch('/signalements/statistiques', {
    headers: authHeaders(),
  })
}

export function createSignalement(payload) {
  return apiFetch('/signalements', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

// Upload photo pour un signalement (FormData, pas de Content-Type manuel)
export async function uploadPhotoSignalement(signalementId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/signalements/${signalementId}/photo`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    let msg = `Erreur ${res.status}`
    try { const d = await res.json(); if (d?.message) msg = Array.isArray(d.message) ? d.message.join(', ') : d.message } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export function updateSignalement(id, payload) {
  return apiFetch(`/signalements/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function resoudreSignalement(id, utilisateurResolutionId, commentaire = null) {
  return apiFetch(`/signalements/${id}/resoudre`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ utilisateurResolutionId, commentaire }),
  })
}

export function assignerNiveauSignalement(id, niveauId) {
  return apiFetch(`/signalements/${id}/assigner-niveau`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ niveauId }),
  })
}

export function deleteSignalement(id) {
  return apiFetch(`/signalements/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export function getEntreprises() {
  return apiFetch('/entreprises', {
    headers: authHeaders(),
  })
}

export function createEntreprise(data) {
  return apiFetch('/entreprises', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateEntreprise(id, data) {
  return apiFetch(`/entreprises/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteEntreprise(id) {
  return apiFetch(`/entreprises/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export function getHistoriqueBySignalement(signalementId) {
  return apiFetch(`/historique-signalement/signalement/${signalementId}`, {
    headers: authHeaders(),
  })
}

export function getAllHistoriqueSignalements() {
  return apiFetch('/historique-signalement', {
    headers: authHeaders(),
  })
}

export function getUtilisateurs() {
  return apiFetch('/utilisateurs', {
    headers: authHeaders(),
  })
}

export function updateUtilisateur(id, payload) {
  return apiFetch(`/utilisateurs/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function getStatutsCompte() {
  return apiFetch('/statuts-compte', {
    headers: authHeaders(),
  })
}

export function getHistoriqueStatusUtilisateur() {
  return apiFetch('/historique-status-utilisateur', {
    headers: authHeaders(),
  })
}

export function createHistoriqueStatusUtilisateur(payload) {
  return apiFetch('/historique-status-utilisateur', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function getAllUtilisateurs() {
  return apiFetch('/utilisateurs', {
    headers: authHeaders(),
  })
}

export function supprimerUtilisateur(id) {
  return apiFetch(`/utilisateurs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

// Synchronisation Firebase
export function syncUsersToFirebase() {
  return apiFetch('/auth/sync-firebase', {
    method: 'POST',
    headers: authHeaders(),
  })
}

// Synchronisation des données (Firestore)
// Déclenche une synchronisation serveur -> Firestore (voir back: POST /firestore/sync)
export function syncFirestoreData() {
  return apiFetch('/firestore/sync', {
    method: 'POST',
    headers: authHeaders(),
  })
}

// Récupération des signalements Firebase → base de données locale
export function syncSignalementsFromFirestore() {
  return apiFetch('/firestore/sync-signalements', {
    method: 'POST',
    headers: authHeaders(),
  })
}

// Synchronisation bidirectionnelle complète (toutes les tables)
export function fullBidirectionalSync() {
  return apiFetch('/firestore/full-sync', {
    method: 'POST',
    headers: authHeaders(),
  })
}

export function getUnsyncedUsersCount() {
  return apiFetch('/auth/unsynced-count', {
    headers: authHeaders(),
  })
}

// ==================== JOURNAL ====================

export function getJournal(filter = {}) {
  const params = new URLSearchParams()
  if (filter.action) params.append('action', filter.action)
  if (filter.ressource) params.append('ressource', filter.ressource)
  if (filter.niveau) params.append('niveau', filter.niveau)
  if (filter.utilisateurId) params.append('utilisateurId', filter.utilisateurId)
  if (filter.dateDebut) params.append('dateDebut', filter.dateDebut)
  if (filter.dateFin) params.append('dateFin', filter.dateFin)
  if (filter.limit) params.append('limit', filter.limit)
  if (filter.offset) params.append('offset', filter.offset)
  const query = params.toString()
  return apiFetch(`/journal${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  })
}

export function getJournalStatistiques() {
  return apiFetch('/journal/statistiques', {
    headers: authHeaders(),
  })
}

export function createJournalEntry(payload) {
  return apiFetch('/journal', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

// ==================== SAUVEGARDE ====================

export function getSauvegardes() {
  return apiFetch('/sauvegarde', {
    headers: authHeaders(),
  })
}

export function getSauvegardeStatistiques() {
  return apiFetch('/sauvegarde/statistiques', {
    headers: authHeaders(),
  })
}

export function creerSauvegarde(payload) {
  return apiFetch('/sauvegarde', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function supprimerSauvegarde(id) {
  return apiFetch(`/sauvegarde/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function telechargerSauvegarde(id) {
  const url = `${API_BASE}/sauvegarde/${id}/telecharger`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}`)
    }
    // Récupérer le blob et créer un lien de téléchargement
    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    let fileName = `sauvegarde_${id}.geojson`
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match) fileName = match[1]
    }
    // Créer un lien temporaire pour télécharger
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)
    return { success: true, fileName }
  } catch (error) {
    console.error('Erreur téléchargement:', error)
    throw error
  }
}

// ==================== VALIDATION ====================

export function getValidations() {
  return apiFetch('/validation', {
    headers: authHeaders(),
  })
}

// ==================== NIVEAUX REPARATION ====================

export function getNiveauxReparation() {
  return apiFetch('/niveaux-reparation', {
    headers: authHeaders(),
  })
}

export function getValidationStatistiques() {
  return apiFetch('/validation/statistiques', {
    headers: authHeaders(),
  })
}

export function getSignalementsNonValides() {
  return apiFetch('/validation/non-valides', {
    headers: authHeaders(),
  })
}

export function getValidationsByStatut(statut) {
  return apiFetch(`/validation/statut/${statut}`, {
    headers: authHeaders(),
  })
}

export function validerSignalement(signalementId, payload) {
  return apiFetch(`/validation/${signalementId}`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function validerSignalementAuto(signalementId) {
  return apiFetch(`/validation/auto/${signalementId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
}

export function validerTousSignalementsAuto() {
  return apiFetch('/validation/auto-tous', {
    method: 'POST',
    headers: authHeaders(),
  })
}

// ==================== DASHBOARD ====================

export function getDashboardSummary() {
  return apiFetch('/dashboard/summary', {
    headers: authHeaders(),
  })
}
