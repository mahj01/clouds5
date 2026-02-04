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
              <IonInput v-model="email" inputmode="email" autocomplete="email" placeholder="demo@email.com" />
            </IonItem>
          </div>

          <div class="field">
            <label class="field-label">Password</label>
            <IonItem lines="none">
              <IonInput v-model="password" type="password" autocomplete="current-password" placeholder="Enter your password" />
            </IonItem>
          </div>

          <div class="field remember-field">
            <IonCheckbox v-model="rememberMe" />
            <label class="field-label remember-label">Remember me (30 days)</label>
          </div>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <IonButton
            expand="block"
            type="submit"
            class="login-btn"
            :disabled="isLocked || isSubmitting || !email || !password"
          >
            {{ isSubmitting ? 'Logging in…' : isLocked ? 'Account locked' : 'Login' }}
          </IonButton>
        </form>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonCheckbox } from '@ionic/vue';

import authService from '@/services/auth';

const router = useRouter();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isLocked = ref(false);

function resetForm(opts?: { keepEmail?: boolean }) {
  // Reset the page inputs/state but keep the blocked message visible.
  password.value = '';
  if (!opts?.keepEmail) email.value = '';
}

async function onLogin() {
  errorMessage.value = '';
  isLocked.value = false;
  isSubmitting.value = true;
  try {
    const res = await authService.loginOnline(email.value, password.value, {
      sessionTtlMs: rememberMe.value ? THIRTY_DAYS_MS : undefined,
    });
    if (!res.ok) {
      if (res.error.code === 'ACCOUNT_LOCKED' || res.error.isLocked) {
        // Reset the UI but keep showing the blocked message and keep the button locked.
        isLocked.value = true;
        errorMessage.value = res.error.message || 'Account locked. Contact an administrator.';
        resetForm({ keepEmail: true });
        return;
      }

      const remaining = authService.getRemainingAttemptsFromError(res.error);
      if (typeof remaining === 'number') {
        errorMessage.value = `${res.error.message || 'Invalid email or password.'} (${remaining} attempt(s) remaining)`;
      } else {
        errorMessage.value = res.error.message || 'Invalid email or password.';
      }
      return;
    }

    await router.replace('/home');
  } finally {
    isSubmitting.value = false;
  }
}

const unsubscribe = authService.onFirebaseAuthStateChange((user) => {
  if (user) {
    if (router.currentRoute.value.path !== '/home') {
      router.replace('/home');
    }
  } else {
    if (router.currentRoute.value.path !== '/login') {
      router.replace('/login');
    }
  }
});

onBeforeUnmount(() => unsubscribe());
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
.field.remember-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.remember-label {
  margin: 0;
  color: #666;
}
</style>
