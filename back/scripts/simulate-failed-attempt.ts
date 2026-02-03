/*
  Debug helper:
  - Simulates a mobile failed attempt by incrementing consecutive_failed_attempts
    in `statut_compte_utilisateur/{uid}`.

  Usage:
    cd back
    npx ts-node scripts/simulate-failed-attempt.ts <uid>
*/

import admin from 'firebase-admin'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(path.join(__dirname, '..', 'src', 'serviceAccountKey.json'))

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const firestore = admin.firestore()

async function main() {
  const uid = process.argv[2]
  if (!uid) {
    console.error('Usage: ts-node scripts/simulate-failed-attempt.ts <uid>')
    process.exitCode = 1
    return
  }

  const ref = firestore.collection('statut_compte_utilisateur').doc(uid)
  const res = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists ? Number(snap.data()?.consecutive_failed_attempts ?? 0) : 0
    const next = current + 1
    const locked = next >= 3

    tx.set(
      ref,
      {
        uid,
        statut: locked ? 'bloqué' : 'actif',
        consecutive_failed_attempts: next,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(snap.exists ? null : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      },
      { merge: true },
    )

    return { current, next, locked }
  })

  console.log(res)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
