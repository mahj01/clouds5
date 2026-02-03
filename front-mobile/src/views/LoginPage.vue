<template>
  <IonPage class="login-page">
    <div class="hero" />

    <IonContent class="ion-padding">
      <div class="card">
        <h1 class="title">Sign in</h1>

        <form class="form" @submit.prevent="onLogin">
          <div class="field">
            <label class="field-label">Email</label>
            <IonItem lines="none">
              <IonInput v-model="email" placeholder="demo@email.com"/>
            </IonItem>
          </div>

          <div class="field">
            <label class="field-label">Password</label>
            <IonItem lines="none">
              <IonInput v-model="password" type="password" placeholder="I enter your password"/>
            </IonItem>
          </div>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-if="backendMessage" class="backend-message">{{ backendMessage }}</div>

          <IonButton expand="block" type="submit" class="login-btn">Login</IonButton>
        </form>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonItem, IonInput, IonButton } from '@ionic/vue';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'


const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const backendMessage = ref('');

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'

async function createBackendSession() {
  // Create a session token usable for protected API routes.
  // Backend supports /auth/firebase-login which returns { token, expiresAt, user: { id, role } }
  try {
    const res = await fetch(`${API_BASE}/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, motDePasse: password.value }),
    })
    if (!res.ok) {
      backendMessage.value = `Backend indisponible (HTTP ${res.status}). Le signalement peut être bloqué.`
      return
    }
    const data = await res.json().catch(() => null)
    if (data?.token && data?.expiresAt) {
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_expiresAt', data.expiresAt)
      if (data?.user?.id != null) {
        localStorage.setItem('auth_user_id', String(data.user.id))
        backendMessage.value = ''
      } else {
        backendMessage.value = "Session API créée, mais id_utilisateur manquant. Le signalement est bloqué."
      }
    } else {
      backendMessage.value = 'Réponse API invalide (token manquant). Le signalement peut être bloqué.'
    }
  } catch {
    // If backend is offline, still allow Firebase login UI flow.
    backendMessage.value = 'Impossible de contacter le backend. Le signalement est bloqué.'
  }
}

async function onLogin() {
  errorMessage.value = '';
  backendMessage.value = '';
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    await createBackendSession()
    // redirect after successful sign-in
    router.replace('/home')
  } catch (err) {
    console.error('Login failed', err)
    // Show user-facing error message
    const error = err as { code?: string };
    if (error && error.code === 'auth/invalid-credential') {
      errorMessage.value = 'Invalid email or password.';
    } else {
      errorMessage.value = 'Login failed. Please try again.';
    }
  }
}

async function onLogout() {
  await signOut(auth)
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // if user is logged in, ensure they are on the home page
    if (router.currentRoute.value.path !== '/home') {
      router.replace('/home')
    }
  } else {
    // if user logged out and is on a protected page, send to login
    if (router.currentRoute.value.path !== '/login') {
      router.replace('/login')
    }
  }
})
</script>

<style scoped>
.hero {
  height: 220px;
  background: linear-gradient(180deg, #222428 0%, #0f1112 100%);
  border-bottom-left-radius: 50% 12%;
  border-bottom-right-radius: 50% 12%;
}

.login-page {
  background: linear-gradient(180deg,#0b0b0c 0%, #151617 100%);
  min-height: 100vh;
}

.card {
  background: #ffffff;
  border-radius: 18px;
  padding: 22px;
  margin-top: -70px;
  box-shadow: 0 18px 40px rgba(2,6,12,0.7);
}

.title {
  margin: 0 0 12px 0;
  font-size: 28px;
  color: #222;
}

.field {
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.forgot {
  color: #7f8c8d;
  font-size: 13px;
  text-decoration: none;
}

.login-btn {
  --border-radius: 12px;
  margin-bottom: 12px;
  background: linear-gradient(180deg,#2b2b2b,#111);
  color: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
}

.signup {
  text-align: center;
  color: #8c8c8c;
  font-size: 14px;
}

.signup a {
  color: #2b2b2b;
  text-decoration: none;
  font-weight: 600;
}

/* style Ionic items/inputs via CSS variables */
.input-item {
  --background: #0f0f10;
  --color: #e6e6e6;
  border-radius: 6px;
  padding: 8px 12px;
}

.card ::v-deep(.ion-input) {
  color: #e6e6e6;
}
 .error-message {
   color: #e74c3c;
   background: #fff0f0;
   border: 1px solid #e74c3c;
   border-radius: 8px;
   padding: 8px 12px;
   margin-bottom: 12px;
   text-align: center;
   font-size: 15px;
 }

.backend-message {
  color: #8a6d3b;
  background: #fff8e1;
  border: 1px solid #d7b77a;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  text-align: center;
  font-size: 14px;
}
</style>
