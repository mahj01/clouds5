<template>
  <IonPage>
    <IonHeader :translucent="true">
      <IonToolbar>
        <IonTitle>Blank</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="goToNotifications" class="notification-btn">
            <IonIcon :icon="notificationsOutline" />
            <IonBadge v-if="unreadCount > 0" color="danger" class="notification-badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </IonBadge>
          </IonButton>
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
          <IonButton expand="block" fill="outline" style="margin-top: 10px" @click="goToNotifications">
            <IonIcon :icon="notificationsOutline" slot="start" />
            Notifications
            <IonBadge v-if="unreadCount > 0" color="danger" style="margin-left: 8px">{{ unreadCount }}</IonBadge>
          </IonButton>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonBadge } from '@ionic/vue';
import { notificationsOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import authService, { getCurrentUser } from '@/services/auth';
import { getUnreadCount } from '@/services/push-notifications';

const router = useRouter();
const unreadCount = ref(0);

async function loadUnreadCount() {
  try {
    const user = await getCurrentUser();
    if (user?.uid) {
      unreadCount.value = await getUnreadCount(user.uid);
    }
  } catch (e) {
    console.warn('Erreur chargement badge notifications:', e);
  }
}

function goToNotifications() {
  router.push('/notifications');
}

// Écouter les notifications push reçues pour mettre à jour le badge
function onPushReceived() {
  loadUnreadCount();
}

onMounted(() => {
  loadUnreadCount();
  window.addEventListener('push-notification-received', onPushReceived);
});

onUnmounted(() => {
  window.removeEventListener('push-notification-received', onPushReceived);
});

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

.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 10px;
  padding: 2px 5px;
  min-width: 16px;
  border-radius: 10px;
}
</style>
