import { getFirebaseAdmin } from "../firebase";
import type { FirebaseUser } from "../models/user.model";

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function verifyIdToken(idToken: string): Promise<FirebaseUser> {
  const admin = getFirebaseAdmin();
  const decoded = await admin.auth().verifyIdToken(idToken);

  const user: FirebaseUser = { uid: decoded.uid };
  if (decoded.email) user.email = decoded.email;
  if (decoded.name) user.name = decoded.name;
  if (decoded.picture) user.picture = decoded.picture;
  return user;
}

export function getIdTokenFromAuthHeader(
  authorizationHeader: string | undefined
): string | null {
  return extractBearerToken(authorizationHeader);
}
