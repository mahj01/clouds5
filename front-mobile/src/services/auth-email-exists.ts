import { fetchSignInMethodsForEmail } from 'firebase/auth'
import { auth as firebaseAuth } from '@/firebase'
import { getUidForEmail } from './auth-identity'

/**
 * Checks whether an email exists.
 *
 * Preferred: Firebase Auth sign-in methods.
 * Fallback: Firestore `email_uid` index (populated via admin script).
 */
export async function firebaseEmailExists(emailRaw: string): Promise<boolean> {
  const email = String(emailRaw || '').trim().toLowerCase()
  if (!email) return false

  try {
    const methods = await fetchSignInMethodsForEmail(firebaseAuth, email)
    if (Array.isArray(methods) && methods.length > 0) return true
  } catch (err) {
    console.warn('[firebaseEmailExists] fetchSignInMethodsForEmail failed; falling back to email_uid index', err)
  }

  // Fallback to our index:
  const uid = await getUidForEmail(email)
  return !!uid
}
