import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

export const firebaseConfig = {
  apiKey: "AIzaSyB7OZ-jgiIcfOL60a9du8YePhNxXbM2uyM",
  authDomain: "test-auth-59124.firebaseapp.com",
  projectId: "test-auth-59124",
  storageBucket: "test-auth-59124.firebasestorage.app",
  messagingSenderId: "780332534172",
  appId: "1:780332534172:web:4bd93215bf80ded471a059"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

export async function firebaseSignInWithPassword(email: string, password: string) {
  const apiKey = firebaseConfig?.apiKey;
  if (!apiKey) throw new Error('Firebase API key not configured');
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || 'Firebase sign-in failed');
  }
  return res.json();
}

export async function firebaseSignUpWithPassword(email: string, password: string) {
  const apiKey = firebaseConfig?.apiKey;
  if (!apiKey) throw new Error('Firebase API key not configured');
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Firebase sign-up failed');
  }
  return data;
}