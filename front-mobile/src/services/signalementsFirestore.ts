import { addDoc, collection, getDocsFromServer, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase'

export const SIGNALMENT_COLLECTION = 'signalement'

export type FirestoreSignalementCreate = {
  description?: string
  surfaceM2?: number
  latitude: number
  longitude: number
}

export type FirestoreSignalement = {
  id: string
  titre: string | null
  description: string | null
  latitude: number
  longitude: number
  date_signalement_ms: number | null
  statut: string
  surface_m2: number | null
  budget: number | null
  id_utilisateur: number
  id_entreprise: number | null
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
  return {
    id,
    titre: d?.titre ?? null,
    description: d?.description ?? null,
    latitude: Number(d?.latitude),
    longitude: Number(d?.longitude),
    date_signalement_ms: toMillis(d?.date_signalement),
    statut: String(d?.statut ?? 'nouveau'),
    surface_m2: d?.surface_m2 != null ? Number(d.surface_m2) : null,
    budget: d?.budget != null ? Number(d.budget) : null,
    id_utilisateur: Number(d?.id_utilisateur),
    id_entreprise: d?.id_entreprise != null ? Number(d.id_entreprise) : null,
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

  // Try to get id_utilisateur from localStorage (set during API login)
  // If not available, we use null - the Firebase UID will serve as user identifier
  const id_utilisateur_raw = localStorage.getItem('auth_user_id') || ''
  const id_utilisateur_num = Number(id_utilisateur_raw)
  const id_utilisateur = Number.isInteger(id_utilisateur_num) && id_utilisateur_num > 0 ? id_utilisateur_num : null

  // Conform to SQL-like column names without forcing a numeric PK in Firestore.
  // Firestore will generate the document id.
  const docData = {
    titre: null,
    description: input.description ?? null,
    latitude: roundTo(input.latitude, 6),
    longitude: roundTo(input.longitude, 6),
    date_signalement: serverTimestamp(),
    statut: 'nouveau',
    surface_m2: input.surfaceM2 != null ? roundTo(input.surfaceM2, 2) : null,
    budget: null,
    id_utilisateur,
    id_entreprise: null,

    // Firebase user identification (always available when logged in)
    utilisateurUid: user.uid,
    utilisateurEmail: user.email ?? null,

    // Timestamps
    createdAt: serverTimestamp(),
  }

  // Collection name matches the SQL table: "signalement"
  const ref = await addDoc(collection(db, SIGNALMENT_COLLECTION), docData)
  return { id: ref.id, ...docData }
}
