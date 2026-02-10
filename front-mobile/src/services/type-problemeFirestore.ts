import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

// We keep this separate from type_signalement.
// Expected Firestore collection: "type_probleme"
export const TYPE_PROBLEME_COLLECTION = 'type_probleme'

export type FirestoreTypeProbleme = {
  id: string
  libelle: string
  actif: boolean
}

function docToTypeProbleme(id: string, d: any): FirestoreTypeProbleme {
  return {
    id,
    libelle: String(d?.libelle ?? ''),
    actif: Boolean(d?.actif ?? true),
  }
}

export function subscribeTypesProbleme(
  onItems: (items: FirestoreTypeProbleme[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = collection(db, TYPE_PROBLEME_COLLECTION)
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const items: FirestoreTypeProbleme[] = snap.docs.map((doc) => docToTypeProbleme(doc.id, doc.data()))
      onItems(items)
    },
    (err) => onError?.(err),
  )
}

