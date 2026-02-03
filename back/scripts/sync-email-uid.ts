/*
  One-time sync script:
  - Lists Firebase Auth users (Admin SDK)
  - Writes email->uid mapping to Firestore collection `email_uid`

  Usage (PowerShell):
    cd back
    npx ts-node scripts/sync-email-uid.ts

  Notes:
  - Requires back/src/serviceAccountKey.json to be valid.
  - Safe & idempotent: merges into docs keyed by normalized email.
*/

import admin from 'firebase-admin'
import path from 'path'
import { fileURLToPath } from 'url'

// Use the same service account your backend already has
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(path.join(__dirname, '..', 'src', 'serviceAccountKey.json'))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const firestore = admin.firestore()

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase()
}

async function main() {
  let nextPageToken: string | undefined
  let total = 0

  console.log('[sync-email-uid] starting…')

  do {
    const res = await admin.auth().listUsers(1000, nextPageToken)
    nextPageToken = res.pageToken

    const batch = firestore.batch()
    let batchCount = 0

    for (const u of res.users) {
      const email = u.email
      if (!email) continue
      const docId = normalizeEmail(email)
      if (!docId) continue

      const ref = firestore.collection('email_uid').doc(docId)
      batch.set(
        ref,
        {
          email: docId,
          uid: u.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      batchCount++
      total++
    }

    if (batchCount > 0) {
      await batch.commit()
      console.log(`[sync-email-uid] wrote ${batchCount} mappings (total ${total})`)
    }
  } while (nextPageToken)

  console.log(`[sync-email-uid] done. total mappings: ${total}`)
}

main().catch((e) => {
  console.error('[sync-email-uid] failed:', e)
  process.exitCode = 1
})
