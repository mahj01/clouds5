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

import { EmailUidSyncService } from '../src/notifications/email-uid-sync.service'

async function main() {
  console.log('[sync-email-uid] starting…')

  const svc = new EmailUidSyncService()
  const res = await svc.syncAllEmailUidMappings({ reason: 'cli' })

  console.log(`[sync-email-uid] done. total mappings: ${res.totalWritten}`)
}

main().catch((e) => {
  console.error('[sync-email-uid] failed:', e)
  process.exitCode = 1
})
