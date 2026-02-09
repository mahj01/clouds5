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
          <IonButton expand="block" fill="outline" style="margin-top: 10px" @click="$router.push('/signalements')">
            Signalements (debug)
          </IonButton>
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
  
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  
  color: #8c8c8c;
  
  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
