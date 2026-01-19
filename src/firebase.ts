import admin from "firebase-admin";

let initialized = false;

function parseServiceAccountJson(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON."
    );
  }
}

export function getFirebaseAdmin(): typeof admin {
  if (!initialized) {
    const serviceAccount = parseServiceAccountJson();
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...(projectId ? { projectId } : {}),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        ...(projectId ? { projectId } : {}),
      });
    }

    initialized = true;
  }

  return admin;
}
