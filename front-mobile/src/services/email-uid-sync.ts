// The Firebase client SDK (used in front-mobile) cannot list all users.
// Listing users requires Firebase Admin SDK in a trusted environment.

export async function syncAllEmailUidMappings(): Promise<void> {
  throw new Error(
    'Not supported in the mobile app. Use the backend script `back/scripts/sync-email-uid.ts` (Firebase Admin SDK) to populate email_uid.',
  )
}
