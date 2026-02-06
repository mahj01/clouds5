import type { FirestoreSignalement } from '@/services/signalementsFirestore'

export type SignalementStatut = 'nouveau' | 'en_cours' | 'cloture' | 'autre'

export type RecapFilters = {
  statut: 'all' | SignalementStatut
  type: 'all' | string
}

export type BudgetStats = {
  total: number
  average: number | null
  countWithBudget: number
}

export type ProgressStats = {
  overallPct: number
  countsByStatut: Record<SignalementStatut, number>
}

export type RecapKpis = {
  totalCount: number
  budget: BudgetStats
  progress: ProgressStats
  countsByType: Record<string, number>
}

export function normalizeStatut(raw: unknown): SignalementStatut {
  const v = String(raw ?? '').trim().toLowerCase()
  if (v === 'nouveau') return 'nouveau'
  if (v === 'en_cours' || v === 'encours' || v === 'en cours') return 'en_cours'
  if (v === 'cloture' || v === 'clôturé' || v === 'cloturé' || v === 'cloturee' || v === 'cloturee') return 'cloture'
  return 'autre'
}

export function buildTypeFromSignalement(s: FirestoreSignalement): string {
  // Prefer the dedicated Firestore field, fallback to older docs using `titre`.
  const raw = (s.type_signalement ?? '').trim() || (s.titre ?? '').trim()
  return raw || 'Inconnu'
}

export function computeProgressPctFromStatut(statut: SignalementStatut): number {
  // Simple mapping: you can refine later if you add a real "progressPct" field in Firestore.
  switch (statut) {
    case 'nouveau':
      return 0
    case 'en_cours':
      return 50
    case 'cloture':
      return 100
    default:
      return 0
  }
}

export function filterSignalements(items: FirestoreSignalement[], filters: Partial<RecapFilters>): FirestoreSignalement[] {
  const statut = filters.statut ?? 'all'
  const type = filters.type ?? 'all'

  return items.filter((s) => {
    const sStatut = normalizeStatut(s.statut)
    const sType = buildTypeFromSignalement(s)

    const statutOk = statut === 'all' || sStatut === statut
    const typeOk = type === 'all' || sType === type

    return statutOk && typeOk
  })
}

export function computeBudgetStats(items: FirestoreSignalement[]): BudgetStats {
  let total = 0
  let countWithBudget = 0

  for (const s of items) {
    const b = s.budget
    if (typeof b === 'number' && Number.isFinite(b)) {
      total += b
      countWithBudget += 1
    }
  }

  const average = countWithBudget ? total / countWithBudget : null
  return { total, average, countWithBudget }
}

export function computeProgressStats(items: FirestoreSignalement[]): ProgressStats {
  const countsByStatut: Record<SignalementStatut, number> = {
    nouveau: 0,
    en_cours: 0,
    cloture: 0,
    autre: 0,
  }

  let sumPct = 0
  for (const s of items) {
    const st = normalizeStatut(s.statut)
    countsByStatut[st] += 1
    sumPct += computeProgressPctFromStatut(st)
  }

  const overallPct = items.length ? sumPct / items.length : 0
  return { overallPct, countsByStatut }
}

export function computeCountsByType(items: FirestoreSignalement[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of items) {
    const t = buildTypeFromSignalement(s)
    out[t] = (out[t] ?? 0) + 1
  }
  return out
}

export function computeRecapKpis(items: FirestoreSignalement[]): RecapKpis {
  return {
    totalCount: items.length,
    budget: computeBudgetStats(items),
    progress: computeProgressStats(items),
    countsByType: computeCountsByType(items),
  }
}
