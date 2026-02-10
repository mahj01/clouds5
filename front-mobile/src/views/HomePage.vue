<template>
  <IonPage>
    <IonHeader :translucent="true">
      <IonToolbar>
        <IonTitle>Blank</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="$router.push('/map')">Map</IonButton>
          <IonButton color="medium" @click="onLogout">Logout</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true">
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">Blank</IonTitle>
        </IonToolbar>
      </IonHeader>

      <div id="container">
        <strong>Ready to create an app?</strong>
        <p>Start with Ionic <a target="_blank" rel="noopener noreferrer" href="https://ionicframework.com/docs/components">UI Components</a></p>
        <div style="margin-top: 18px">
          <IonButton expand="block" @click="$router.push('/map')">Open Map</IonButton>
          <IonButton expand="block" fill="outline" style="margin-top: 10px" @click="$router.push('/mes-signalements')">
            Mes signalements
          </IonButton>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/vue';
import { useRouter } from 'vue-router';
import authService from '@/services/auth';

const router = useRouter();

async function onLogout() {
  // Best-effort sign out + session removal.
  try {
    await authService.firebaseLogout();
  } catch {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
  } finally {
    await router.replace('/login');
  }
}
</script>

<style scoped>
#container {
  text-align: center;
  padding: 32px 24px;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 24px;
  line-height: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ion-text-color);
  display: block;
  margin-bottom: 8px;
}

#container p {
  font-size: 15px;
  line-height: 22px;
  color: #64748b;
  margin: 0 0 28px;
}

#container a {
  text-decoration: none;
  color: var(--ion-color-primary);
  font-weight: 600;
  transition: opacity 0.2s ease;
}

#container a:hover {
  opacity: 0.8;
}

#container div ion-button {
  --border-radius: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

#container div ion-button:first-child {
  --background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  --box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

#container div ion-button[fill="outline"] {
  --border-width: 1.5px;
  --border-color: #e2e8f0;
  --color: var(--ion-text-color);
  --background: transparent;
  margin-top: 12px !important;
}

#container div ion-button[fill="outline"]:hover {
  --background: #f8fafc;
}
</style>
