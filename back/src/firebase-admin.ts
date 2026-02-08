var admin = require('firebase-admin');
var fs = require('fs');
var path = require('path');

function loadServiceAccount() {
  // 1) If GOOGLE_APPLICATION_CREDENTIALS env var points to a file, try to read it
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    try {
      const raw = fs.readFileSync(envPath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      // continue to next attempts
    }
  }

  // 2) Try from project src folder (when running from project root)
  try {
    const p = path.resolve(process.cwd(), 'src', 'serviceAccountKey.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    // ignore
  }

  // 3) Try a dist-aware path relative to this file (works when running built code in dist/)
  try {
    // __dirname at runtime will be dist/src when compiled; go up to project root then src
    const alt = path.resolve(__dirname, '..', '..', 'src', 'serviceAccountKey.json');
    if (fs.existsSync(alt)) {
      return JSON.parse(fs.readFileSync(alt, 'utf8'));
    }
  } catch (e) {
    // ignore
  }

  // 4) Fallback: try require relative to this file (legacy)
  try {
    // This may work when running from TS via ts-node
    return require('./serviceAccountKey.json');
  } catch (e) {
    try {
      return require('../src/serviceAccountKey.json');
    } catch (e2) {
      return null;
    }
  }
}

const serviceAccount = loadServiceAccount();

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || serviceAccount.projectId,
  });
} else {
  // If no service account is provided, initialize with default credentials
  // which will use the environment (e.g., GCE service account) if available.
  console.warn('[firebase-admin] serviceAccount not found; initializing with default credentials (may fail)');
  admin.initializeApp();
}

export const firestore = admin.firestore();
export const messaging = admin.messaging();


