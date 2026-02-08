<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { checkAndRequestGPSPermission } from '@/services/gps-permission';

const router = useRouter();

// Gestionnaire de clic sur notification push
function handleNotificationTap(event: CustomEvent) {
  const { signalementId } = event.detail;
  if (signalementId) {
    router.push(`/signalements/${signalementId}`);
  }
}

onMounted(async () => {
  await checkAndRequestGPSPermission();
  
  // Écouter les clics sur notifications push
  window.addEventListener('push-notification-tap', handleNotificationTap as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('push-notification-tap', handleNotificationTap as EventListener);
});
</script>
