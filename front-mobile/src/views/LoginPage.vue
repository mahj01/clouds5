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
import { registerForPushNotifications } from '@/services/push-notifications';
import { apiPost } from '@/services/api';
import { checkAndRequestGPSPermission } from '@/services/gps-permission';
import { upsertUserFcmTokenInFirestore } from '@/services/firestore-user-profile';

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

    // IMPORTANT: request GPS permission first, then push permissions.
    // We've seen concurrency issues on Android if multiple permission/token flows overlap.
    try {
      console.log('[login] requesting GPS permission (pre-push)');
      await checkAndRequestGPSPermission();
    } catch (e) {
      console.warn('[login] GPS permission flow failed (continuing)', e);
    }

    // Register device for push notifications and send token to backend (best-effort)
    try {
      console.log('[login] starting push registration (post-gps)');
      const token = await registerForPushNotifications();
      console.log('[login] push token acquired, syncing to Firestore + backend');

      // Store on Firestore user doc (fallback path for backend)
      try {
        const uid = res.data?.user?.uid;
        const pgUserId = (res.data as any)?.user?.pgId ?? (res.data as any)?.user?.id ?? null;
        if (uid) {
          await upsertUserFcmTokenInFirestore({ firebaseUid: uid, token, pgUserId });
          console.log('[login] push token stored in Firestore users/' + uid + (pgUserId ? (' and utilisateur/' + pgUserId) : ''));
        } else {
          console.log('[login] no firebase uid in session (skip Firestore token write)');
        }
      } catch (e) {
        console.warn('[login] Firestore token write failed (continuing)', e);
      }

      await apiPost('/utilisateurs/me/fcm-token', { fcmToken: token });
      console.log('[login] push token sent to backend');
    } catch (e) {
      console.warn('[push] token registration failed', e);
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
  height: 240px;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
  border-bottom-left-radius: 50% 14%;
  border-bottom-right-radius: 50% 14%;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 60%);
}

.login-page {
  --background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
}

.card {
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 28px;
  margin: -80px 16px 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
}

.title {
  margin: 0 0 24px 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.field {
  margin-bottom: 18px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field ion-item {
  --background: #f8fafc;
  --border-color: #e2e8f0;
  --border-radius: 12px;
  --border-width: 1.5px;
  --border-style: solid;
  --min-height: 52px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.field ion-item:focus-within {
  --border-color: var(--ion-color-primary);
  --background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
  color: #64748b;
}

.forgot {
  color: #64748b;
  font-size: 13px;
  text-decoration: none;
  font-weight: 500;
}

.login-btn {
  --border-radius: 14px;
  --background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  --box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  --color: #ffffff;
  margin-top: 8px;
  margin-bottom: 12px;
  height: 54px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  transition: transform 0.15s ease;
}

.login-btn:active {
  transform: scale(0.98);
}

.signup {
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.signup a {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-weight: 700;
}

.error-message {
  color: #dc2626;
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.field.remember-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.remember-label {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #1e293b;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  .title {
    color: #f1f5f9;
  }

  .field ion-item {
    --background: #0f172a;
    --border-color: #334155;
  }

  .field ion-item:focus-within {
    --background: #162033;
    --border-color: var(--ion-color-primary);
  }

  .error-message {
    background: #1c1917;
    border-color: #7f1d1d;
    color: #fca5a5;
  }

  .field-label {
    color: #94a3b8;
  }

  .remember-label {
    color: #94a3b8;
  }
}
</style>
