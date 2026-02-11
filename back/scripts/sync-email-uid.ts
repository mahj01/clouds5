/*
  One-time sync script:
  - Reads Postgres Utilisateur rows (email + firebaseUid)
  - Writes email->uid mapping to Firestore collection `email_uid`

  Usage (PowerShell):
    cd back
    npx ts-node scripts/sync-email-uid.ts

  Notes:
  - Requires DB connection env vars to be set (same as backend).
  - Requires Firebase Admin credentials to write to Firestore.
  - Safe & idempotent: merges into docs keyed by normalized email.
*/

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { EmailUidSyncService } from '../src/notifications/email-uid-sync.service'

async function main() {
  console.log('[sync-email-uid] starting…')

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  try {
    const svc = app.get(EmailUidSyncService)
    const res = await svc.syncAllEmailUidMappings({ reason: 'cli' })
    console.log(`[sync-email-uid] done. total mappings: ${res.totalWritten}`)
  } finally {
    await app.close()
  }
}

main().catch((e) => {
  console.error('[sync-email-uid] failed:', e)
  process.exitCode = 1
})
