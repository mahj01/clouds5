/*
  Debug helper:
  - Reads Firestore `statut_compte_utilisateur/{uid}` and prints the doc.

  Usage:
    cd back
    npx ts-node scripts/check-statut-compte.ts <uid>
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
    console.error('Usage: ts-node scripts/check-statut-compte.ts <uid>')
    process.exitCode = 1
    return
  }

  const snap = await firestore.collection('statut_compte_utilisateur').doc(uid).get()
  console.log('doc id:', uid)
  console.log('exists:', snap.exists)
  console.log('data:', snap.data())
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
