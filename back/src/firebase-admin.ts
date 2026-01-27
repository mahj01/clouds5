var admin = require("firebase-admin");

var serviceAccount = require("../src/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const firestore = admin.firestore();


