import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

export const TYPE_SIGNALEMENT_COLLECTION = 'type_signalement'

export type FirestoreTypeSignalement = {
  id: string
  libelle: string
  actif: boolean
}

function docToTypeSignalement(id: string, d: any): FirestoreTypeSignalement {
  return {
    id,
    libelle: String(d?.libelle ?? ''),
    actif: Boolean(d?.actif ?? true),
  }
}

export function subscribeTypesSignalement(
  onItems: (items: FirestoreTypeSignalement[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = collection(db, TYPE_SIGNALEMENT_COLLECTION)
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const items: FirestoreTypeSignalement[] = snap.docs.map((doc) => docToTypeSignalement(doc.id, doc.data()))
      onItems(items)
    },
    (err) => onError?.(err),
  )
}
