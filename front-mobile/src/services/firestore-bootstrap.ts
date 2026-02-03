import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const INIT_DOC_ID = 'bootstrap_init'
const BOOTSTRAP_GUARD_COLLECTION = 'app_bootstrap'
const BOOTSTRAP_GUARD_DOC = 'firestore_collections_v1'

/**
 * Firestore rejects document IDs that start and end with '__' (reserved).
 * We create one dummy doc per collection with the expected fields.
 */
export async function bootstrapFirestoreCollectionsOnce() {
  const guardRef = doc(db, BOOTSTRAP_GUARD_COLLECTION, BOOTSTRAP_GUARD_DOC)
  const guardSnap = await getDoc(guardRef)
  if (guardSnap.exists()) return

  // 1) statut_compte_utilisateur dummy doc
  await setDoc(
    doc(db, 'statut_compte_utilisateur', INIT_DOC_ID),
    {
      uid: INIT_DOC_ID,
      statut: 'actif',
      consecutive_failed_attempts: 0,
      updatedAt: serverTimestamp(),
      lastLoginAttemptAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      __system: true,
      note: 'bootstrap placeholder',
    },
    { merge: true },
  )

  // 2) email_uid dummy doc
  await setDoc(
    doc(db, 'email_uid', INIT_DOC_ID),
    {
      email: 'bootstrap@local',
      uid: INIT_DOC_ID,
      updatedAt: serverTimestamp(),
      __system: true,
      note: 'bootstrap placeholder',
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )

  // 3) mark as done
  await setDoc(
    guardRef,
    {
      done: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
