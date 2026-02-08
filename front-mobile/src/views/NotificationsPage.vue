<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/home" />
        </IonButtons>
        <IonTitle>Notifications</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="markAllRead" :disabled="unreadCount === 0">
            <IonIcon :icon="checkmarkDoneOutline" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <IonRefresher slot="fixed" @ionRefresh="doRefresh($event)">
        <IonRefresherContent />
      </IonRefresher>

      <div v-if="loading" class="loading-container">
        <IonSpinner />
      </div>

      <IonList v-else-if="notifications.length > 0">
        <IonItemSliding v-for="notif in notifications" :key="notif.id">
          <IonItem 
            :class="{ 'unread': !notif.lu }" 
            button 
            @click="openNotification(notif)"
          >
            <IonIcon 
              :icon="notif.lu ? notificationsOutline : notifications" 
              slot="start" 
              :color="notif.lu ? 'medium' : 'primary'"
            />
            <IonLabel>
              <h2>{{ notif.titre }}</h2>
              <p>{{ notif.message }}</p>
              <p class="date">{{ formatDate(notif.dateCreation) }}</p>
            </IonLabel>
            <IonBadge v-if="!notif.lu" color="primary" slot="end">Nouveau</IonBadge>
          </IonItem>
          <IonItemOptions side="end">
            <IonItemOption color="primary" @click="markRead(notif)">
              <IonIcon :icon="checkmarkOutline" slot="icon-only" />
            </IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      </IonList>

      <div v-else class="empty-state">
        <IonIcon :icon="notificationsOffOutline" class="empty-icon" />
        <p>Aucune notification</p>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/vue';
import {
  notificationsOutline,
  notifications as notificationsIcon,
  notificationsOffOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
} from 'ionicons/icons';

import { getCurrentUser } from '@/services/auth';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/push-notifications';

interface Notification {
  id: number;
  titre: string;
  message: string;
  lu: boolean;
  dateCreation: string;
  signalement?: { id: number };
}

const router = useRouter();
const loading = ref(true);
const notifications = ref<Notification[]>([]);
const unreadCount = computed(() => notifications.value.filter(n => !n.lu).length);

async function loadNotifications() {
  loading.value = true;
  try {
    const user = await getCurrentUser();
    if (user?.uid) {
      notifications.value = await getNotifications(user.uid);
    }
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
  } finally {
    loading.value = false;
  }
}

async function doRefresh(event: any) {
  await loadNotifications();
  event.target.complete();
}

async function markRead(notif: Notification) {
  if (notif.lu) return;
  await markNotificationRead(notif.id);
  notif.lu = true;
}

async function markAllRead() {
  try {
    const user = await getCurrentUser();
    if (user?.uid) {
      await markAllNotificationsRead(user.uid);
      notifications.value.forEach(n => n.lu = true);
    }
  } catch (error) {
    console.error('Erreur marquage tout lu:', error);
  }
}

async function openNotification(notif: Notification) {
  await markRead(notif);
  if (notif.signalement?.id) {
    router.push(`/signalements/${notif.signalement.id}`);
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

onMounted(loadNotifications);
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.unread {
  --background: var(--ion-color-primary-tint);
}

.date {
  font-size: 12px;
  color: var(--ion-color-medium);
}
</style>
