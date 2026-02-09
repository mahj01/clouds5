import { collection, onSnapshot, query, where, orderBy, getDocsFromServer, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

export const HISTORIQUE_SIGNALMENT_COLLECTION = 'historique_signalement'

/**
 * Firestore historique_signalement document.
 * Foreign key is firebase_signalement_id (NOT the SQL id).
 */
export type FirestoreHistoriqueSignalement = {
  id: string
  firebase_signalement_id: string
  ancien_statut: string | null
  nouveau_statut: string | null
  date_changement_ms: number | null
  /** UtilisateurUid of the creator of the *signalement* (copied for notification/audit) */
  utilisateurUid: string | null
  /** Optional: SQL manager id or any admin identifier (for audit) */
  id_manager: number | null
}

export type FirestoreHistoriqueSignalementCreate = {
  firebase_signalement_id: string
  ancien_statut?: string | null
  nouveau_statut?: string | null
  /** UtilisateurUid of the creator of the signalement */
  utilisateurUid?: string | null
  id_manager?: number | null
}

function toMillis(v: any): number | null {
  if (!v) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v?.toMillis === 'function') return v.toMillis()
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

function docToHistorique(id: string, d: any): FirestoreHistoriqueSignalement {
  return {
    id,
    firebase_signalement_id: String(d?.firebase_signalement_id ?? ''),
    ancien_statut: d?.ancien_statut != null ? String(d.ancien_statut) : null,
    nouveau_statut: d?.nouveau_statut != null ? String(d.nouveau_statut) : null,
    date_changement_ms: toMillis(d?.date_changement_ms) ?? toMillis(d?.date_changement),
    utilisateurUid: d?.utilisateurUid != null ? String(d.utilisateurUid) : null,
    id_manager: d?.id_manager != null && Number.isFinite(Number(d.id_manager)) ? Number(d.id_manager) : null,
  }
}

export async function fetchHistoriqueForSignalement(firebaseSignalementId: string) {
  const q = query(
    collection(db, HISTORIQUE_SIGNALMENT_COLLECTION),
    where('firebase_signalement_id', '==', firebaseSignalementId),
    orderBy('date_changement_ms', 'desc'),
  )

  const snap = await getDocsFromServer(q)
  return snap.docs.map((d) => docToHistorique(d.id, d.data()))
}

export function subscribeHistoriqueForSignalement(
  firebaseSignalementId: string,
  onItems: (items: FirestoreHistoriqueSignalement[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = query(
    collection(db, HISTORIQUE_SIGNALMENT_COLLECTION),
    where('firebase_signalement_id', '==', firebaseSignalementId),
    orderBy('date_changement_ms', 'desc'),
  )

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => docToHistorique(d.id, d.data()))
      onItems(items)
    },
    (err) => onError?.(err),
  )
}

/**
 * Create an historique entry from the mobile app.
 * Uses a client-generated id (single write) so the full doc is stored as-is.
 */
export async function createHistoriqueSignalementInFirestore(input: FirestoreHistoriqueSignalementCreate) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Vous devez être connecté (Firebase) pour écrire un historique.')
  }

  const firebaseId = String(input.firebase_signalement_id || '').trim()
  if (!firebaseId) throw new Error('firebase_signalement_id est requis.')

  const nowMs = Date.now()

  const ref = doc(collection(db, HISTORIQUE_SIGNALMENT_COLLECTION))

  const docData = {
    firebase_signalement_id: firebaseId,
    ancien_statut: input.ancien_statut ?? null,
    nouveau_statut: input.nouveau_statut ?? null,
    date_changement_ms: nowMs,

    // Keep the creator uid of the signalement (copied from the signalement doc)
    utilisateurUid: input.utilisateurUid ?? null,

    // Optional audit field
    id_manager: input.id_manager ?? null,

    // Extra provenance field (who wrote the historique in Firestore)
    ecrit_par_uid: user.uid,
  }

  await setDoc(ref, docData)

  return docToHistorique(ref.id, docData)
}
