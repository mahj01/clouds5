import { describe, expect, it } from 'vitest'

import {
  computeBudgetStats,
  computeProgressStats,
  filterSignalements,
  normalizeStatut,
  type RecapFilters,
} from '@/services/recap-signalement'
import type { FirestoreSignalement } from '@/services/signalementsFirestore'

function s(partial: Partial<FirestoreSignalement>): FirestoreSignalement {
  return {
    id: partial.id ?? 'id',
    firebase_signalement_id: partial.firebase_signalement_id ?? (partial.id ?? 'id'),
    titre: partial.titre ?? null,
    type_signalement: partial.type_signalement ?? null,
    description: partial.description ?? null,
    latitude: partial.latitude ?? 0,
    longitude: partial.longitude ?? 0,
    date_signalement_ms: partial.date_signalement_ms ?? null,
    statut: partial.statut ?? 'nouveau',
    surface: partial.surface ?? null,
    budget: partial.budget ?? null,
    entreprise: partial.entreprise ?? null,
    utilisateurUid: partial.utilisateurUid ?? null,
  }
}

describe('recap-signalement', () => {
  it('normalizeStatut buckets unknown values to autre', () => {
    expect(normalizeStatut('nouveau')).toBe('nouveau')
    expect(normalizeStatut('En cours')).toBe('en_cours')
    expect(normalizeStatut('clôturé')).toBe('cloture')
    expect(normalizeStatut('something')).toBe('autre')
  })

  it('computeBudgetStats ignores null and computes average for numerics', () => {
    const items = [s({ budget: null }), s({ budget: 10 }), s({ budget: 20 })]
    expect(computeBudgetStats(items)).toEqual({ total: 30, average: 15, countWithBudget: 2 })
  })

  it('computeProgressStats counts status and averages mapped progress', () => {
    const items = [s({ statut: 'nouveau' }), s({ statut: 'en_cours' }), s({ statut: 'cloture' })]
    const out = computeProgressStats(items)
    expect(out.countsByStatut.nouveau).toBe(1)
    expect(out.countsByStatut.en_cours).toBe(1)
    expect(out.countsByStatut.cloture).toBe(1)
    expect(out.overallPct).toBeCloseTo(150 / 3)
  })

  it('filterSignalements filters by status and by inferred type (titre)', () => {
    const items = [s({ id: '1', statut: 'nouveau', titre: 'A' }), s({ id: '2', statut: 'cloture', titre: 'B' })]
    const filters: RecapFilters = { statut: 'cloture', type: 'B' }
    const out = filterSignalements(items, filters)
    expect(out.map((x) => x.id)).toEqual(['2'])
  })
})
