/*
  Debug helper:
  - Reads Firestore `email_uid/{normalizedEmail}` and prints uid.

  Usage:
    cd back
    npx ts-node scripts/check-email-uid.ts testmobile@example.com
*/

import admin from 'firebase-admin'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(path.join(__dirname, '..', 'src', 'serviceAccountKey.json'))

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const firestore = admin.firestore()

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase()
}

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: ts-node scripts/check-email-uid.ts <email>')
    process.exitCode = 1
    return
  }

  const id = normalizeEmail(email)
  const snap = await firestore.collection('email_uid').doc(id).get()
  console.log('doc id:', id)
  console.log('exists:', snap.exists)
  console.log('data:', snap.data())
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
