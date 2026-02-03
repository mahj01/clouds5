import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export const EMAIL_UID_COLLECTION = 'email_uid'

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase()
}

const INIT_DOC_ID = 'bootstrap_init'

export async function ensureEmailUidCollection() {
  await setDoc(
    doc(db, EMAIL_UID_COLLECTION, INIT_DOC_ID),
    { __system: true, createdAt: serverTimestamp() },
    { merge: true },
  )
}

/**
 * Store mapping email -> uid.
 * Doc id is the normalized email.
 */
export async function upsertEmailUid(email: string, uid: string) {
  const e = normalizeEmail(email)
  if (!e || !uid) return

  // Best-effort to ensure collection exists.
  await ensureEmailUidCollection()

  await setDoc(
    doc(db, EMAIL_UID_COLLECTION, e),
    {
      email: e,
      uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/** Returns uid for this email if known, else null. */
export async function getUidForEmail(email: string): Promise<string | null> {
  const e = normalizeEmail(email)
  if (!e) return null
  const snap = await getDoc(doc(db, EMAIL_UID_COLLECTION, e))
  if (!snap.exists()) return null
  const data = snap.data() as any
  return typeof data?.uid === 'string' && data.uid ? data.uid : null
}
