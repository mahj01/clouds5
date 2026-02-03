import { apiFetch } from './client.js'

// ==================== Types de Problèmes ====================

export function getTypesProblemes() {
  return apiFetch('/types-problemes')
}

export function getTypesProblemeActifs() {
  return apiFetch('/types-problemes/actifs')
}

export function getTypeProbleme(id) {
  return apiFetch(`/types-problemes/${id}`)
}

export function createTypeProbleme(payload) {
  return apiFetch('/types-problemes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTypeProbleme(id, payload) {
  return apiFetch(`/types-problemes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteTypeProbleme(id) {
  return apiFetch(`/types-problemes/${id}`, {
    method: 'DELETE',
  })
}

// ==================== Problèmes Routiers ====================

export function getProblemesRoutiers() {
  return apiFetch('/problemes-routiers')
}

export function getProblemesRoutiersActifs() {
  return apiFetch('/problemes-routiers/actifs')
}

export function getProblemeRoutier(id) {
  return apiFetch(`/problemes-routiers/${id}`)
}

export function getProblemesByStatut(statut) {
  return apiFetch(`/problemes-routiers/statut/${statut}`)
}

export function getProblemesByType(typeId) {
  return apiFetch(`/problemes-routiers/type/${typeId}`)
}

export function getProblemesGeoJSON(statut = null) {
  const query = statut ? `?statut=${statut}` : ''
  return apiFetch(`/problemes-routiers/geojson${query}`)
}

export function getProblemesStatistiques() {
  return apiFetch('/problemes-routiers/statistiques')
}

export function createProblemeRoutier(payload) {
  return apiFetch('/problemes-routiers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProblemeRoutier(id, payload) {
  return apiFetch(`/problemes-routiers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function resoudreProbleme(id, utilisateurResolutionId, commentaire = null) {
  return apiFetch(`/problemes-routiers/${id}/resoudre`, {
    method: 'POST',
    body: JSON.stringify({ utilisateurResolutionId, commentaire }),
  })
}

export function deleteProblemeRoutier(id) {
  return apiFetch(`/problemes-routiers/${id}`, {
    method: 'DELETE',
  })
}
