const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function parseError(res) {
  let message = `Erreur ${res.status}`
  try {
    const data = await res.json()
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
    }
  } catch {
    // ignore JSON parse errors
  }
  throw new Error(message)
}

export async function apiFetch(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
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
