import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export const STATUT_COMPTE_COLLECTION = 'statut_compte_utilisateur'

const INIT_DOC_ID = 'bootstrap_init'

async function ensureStatutCompteCollection() {
  await setDoc(
    doc(db, STATUT_COMPTE_COLLECTION, INIT_DOC_ID),
    { __system: true, createdAt: serverTimestamp() },
    { merge: true },
  )
}

type StatutCompte = {
  uid: string
  statut: 'actif' | 'bloqué'
  consecutive_failed_attempts: number
  createdAt?: any
  updatedAt?: any
  lastLoginAttemptAt?: any
}

export async function getAccountStatus(uid: string): Promise<{ statut: 'actif' | 'bloqué'; consecutiveFailedAttempts: number }> {
  const ref = doc(db, STATUT_COMPTE_COLLECTION, uid)
  const snap = await getDoc(ref)
  const data = (snap.exists() ? (snap.data() as any) : null) as Partial<StatutCompte> | null

  const statut = (data?.statut === 'bloqué' ? 'bloqué' : 'actif') as 'actif' | 'bloqué'

  const raw = Number((data as any)?.consecutive_failed_attempts ?? 0)
  const consecutiveFailedAttempts = Number.isFinite(raw) && raw > 0 ? raw : 0

  return { statut, consecutiveFailedAttempts }
}

export async function markLoginSuccess(uid: string): Promise<void> {
  await ensureStatutCompteCollection()
  const ref = doc(db, STATUT_COMPTE_COLLECTION, uid)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const isNew = !snap.exists()

    tx.set(
      ref,
      {
        uid,
        statut: 'actif',
        consecutive_failed_attempts: 0,
        lastLoginAttemptAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(isNew ? { createdAt: serverTimestamp() } : null),
      } as StatutCompte,
      { merge: true },
    )
  })
}

export async function markLoginFailure(uid: string): Promise<{ locked: boolean; remainingAttempts: number }> {
  await ensureStatutCompteCollection()
  const ref = doc(db, STATUT_COMPTE_COLLECTION, uid)

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const data = (snap.exists() ? (snap.data() as any) : null) as Partial<StatutCompte> | null

    const raw = Number((data as any)?.consecutive_failed_attempts ?? 0)
    const current = Number.isFinite(raw) && raw > 0 ? raw : 0

    const next = current + 1
    const locked = next >= 3
    const remainingAttempts = Math.max(0, 3 - next)

    tx.set(
      ref,
      {
        uid,
        statut: locked ? 'bloqué' : 'actif',
        consecutive_failed_attempts: next,
        lastLoginAttemptAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(!snap.exists() ? { createdAt: serverTimestamp() } : null),
      } as StatutCompte,
      { merge: true },
    )

    return { locked, remainingAttempts }
  })
}
