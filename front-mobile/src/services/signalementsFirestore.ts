import { collection, doc, getDocsFromServer, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { createHistoriqueSignalementInFirestore } from '@/services/historiqueSignalementFirestore'

export const SIGNALMENT_COLLECTION = 'signalement'

export type FirestoreSignalementCreate = {
  titre?: string
  type_signalement?: string
  description?: string
  surface?: number
  latitude: number
  longitude: number
}

export type FirestoreSignalement = {
  id: string
  /** Stable Firestore doc id to dedupe local DB inserts */
  firebase_signalement_id: string
  titre: string | null
  type_signalement: string | null
  description: string | null
  latitude: number
  longitude: number
  date_signalement_ms: number | null
  statut: string
  surface: number | null
  budget: number | null
  entreprise: string | null
  /** Firebase UID, used to notify the author when status changes */
  utilisateurUid: string | null
}

type SignalementCache = {
  version: 1
  updatedAtMs: number
  items: FirestoreSignalement[]
}

const CACHE_KEY = 'signalement_cache_v1'

function toMillis(v: any): number | null {
  if (!v) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v?.toMillis === 'function') return v.toMillis()
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

export function loadSignalementCache(): FirestoreSignalement[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SignalementCache
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) return []
    return parsed.items
  } catch {
    return []
  }
}

function saveSignalementCache(items: FirestoreSignalement[]) {
  try {
    const payload: SignalementCache = { version: 1, updatedAtMs: Date.now(), items }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }
}

export type SignalementDiff =
  | { type: 'added'; item: FirestoreSignalement }
  | { type: 'modified'; item: FirestoreSignalement }
  | { type: 'removed'; id: string }

function docToSignalement(id: string, d: any): FirestoreSignalement {
  const surface = d?.surface != null ? Number(d.surface) : d?.surface_m2 != null ? Number(d.surface_m2) : null

  // Prefer the explicit millis field; fall back to Firestore Timestamp / Date stored in date_signalement
  const dateMs = toMillis(d?.date_signalement_ms) ?? toMillis(d?.date_signalement)

  const budget = d?.budget != null ? Number(d.budget) : null

  // New schema: entreprise is a label string. Backward-compat: if older docs store a numeric id,
  // we stringify it so callers can still display/dedupe.
  const entrepriseRaw = d?.entreprise ?? d?.entreprise_libelle ?? d?.entrepriseLibelle ?? d?.id_entreprise ?? d?.entrepriseId
  const entreprise = entrepriseRaw != null && String(entrepriseRaw).trim() ? String(entrepriseRaw) : null

  // Prefer explicit field if exists, but default to the actual doc id.
  const firebaseId = d?.firebase_signalement_id != null ? String(d.firebase_signalement_id) : id

  return {
    id,
    firebase_signalement_id: firebaseId,
    titre: d?.titre ?? null,
    type_signalement: d?.type_signalement ?? null,
    description: d?.description ?? null,
    latitude: Number(d?.latitude),
    longitude: Number(d?.longitude),
    date_signalement_ms: dateMs,
    statut: String(d?.statut ?? d?.status ?? 'nouveau'),
    surface: surface != null && Number.isFinite(surface) ? surface : null,
    budget: budget != null && Number.isFinite(budget) ? budget : null,
    entreprise,
    utilisateurUid: d?.utilisateurUid != null ? String(d.utilisateurUid) : null,
  }
}

export async function fetchSignalementsFromServer() {
  const snap = await getDocsFromServer(collection(db, SIGNALMENT_COLLECTION))
  return snap.docs.map((doc) => docToSignalement(doc.id, doc.data()))
}

export function subscribeSignalements(
  onDiffs: (diffs: SignalementDiff[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = collection(db, SIGNALMENT_COLLECTION)

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const diffs: SignalementDiff[] = []
      for (const ch of snap.docChanges()) {
        if (ch.type === 'removed') {
          diffs.push({ type: 'removed', id: ch.doc.id })
          continue
        }
        diffs.push({ type: ch.type, item: docToSignalement(ch.doc.id, ch.doc.data()) } as any)
      }
      if (diffs.length) onDiffs(diffs)
    },
    (err) => {
      onError?.(err)
    },
  )
}

export function applySignalementDiffs(current: Map<string, FirestoreSignalement>, diffs: SignalementDiff[]) {
  for (const d of diffs) {
    if (d.type === 'removed') {
      current.delete(d.id)
    } else {
      current.set(d.item.id, d.item)
    }
  }
  // Persist cache as an array (no ordering requirements).
  const items = Array.from(current.values())
  saveSignalementCache(items)
  return items
}

function roundTo(value: number, decimals: number) {
  const p = 10 ** decimals
  return Math.round(value * p) / p
}

export async function createSignalementInFirestore(input: FirestoreSignalementCreate) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Vous devez être connecté (Firebase) pour envoyer un signalement.')
  }

  const nowMs = Date.now()

  // Generate the Firestore document id client-side so we can store it in the same write.
  const ref = doc(collection(db, SIGNALMENT_COLLECTION))

  // Always write the full canonical document shape.
  // Fields not provided by the user are explicitly stored as null.
  const docData = {
    titre: input.titre?.trim() || null,
    type_signalement: input.type_signalement?.trim() || null,
    description: input.description ?? null,
    latitude: roundTo(input.latitude, 6),
    longitude: roundTo(input.longitude, 6),
    date_signalement_ms: nowMs,
    statut: 'nouveau',
    surface: input.surface != null ? roundTo(input.surface, 2) : null,

    // Not input by the user on submission
    budget: null as number | null,
    entreprise: null as string | null,

    // Firebase user identification (for notifications)
    utilisateurUid: user.uid,

    // Stored for local DB dedupe
    firebase_signalement_id: ref.id,
  }

  await setDoc(ref, docData)

  // Create initial historique entry (user cannot change statut, but we track creation).
  // If this fails, we still return the created signalement.
  try {
    await createHistoriqueSignalementInFirestore({
      firebase_signalement_id: ref.id,
      ancien_statut: null,
      nouveau_statut: 'nouveau',
      utilisateurUid: user.uid,
      id_manager: null,
    })
  } catch {
    // best-effort
  }

  return { id: ref.id, ...docData }
}
