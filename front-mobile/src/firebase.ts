import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB7OZ-jgiIcfOL60a9du8YePhNxXbM2uyM",
  authDomain: "test-auth-59124.firebaseapp.com",
  projectId: "test-auth-59124",
  storageBucket: "test-auth-59124.firebasestorage.app",
  messagingSenderId: "780332534172",
  appId: "1:780332534172:web:4bd93215bf80ded471a059"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
})

