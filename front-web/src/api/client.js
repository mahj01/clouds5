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

export function createSignalement(payload) {
  return apiFetch('/signalements', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function getEntreprises() {
  return apiFetch('/entreprises', {
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

export function updateSignalement(id, payload) {
  return apiFetch(`/signalements/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}
// --------------------------

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
