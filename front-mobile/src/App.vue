<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { checkAndRequestGPSPermission } from '@/services/gps-permission';
import { registerForPushNotifications, bootstrapPushNotifications } from '@/services/push-notifications';

onMounted(async () => {
  // 1) GPS first (you reported a concurrency issue)
  await checkAndRequestGPSPermission();

  // 2) Attach push listeners and register if already granted
  await bootstrapPushNotifications();

  // 3) If permission isn't granted yet, request it now (and log for debugging)
  try {
    console.log('[push] App mounted: trying to ensure push permission');
    await registerForPushNotifications();
  } catch (e) {
    console.warn('[push] App mounted: push registration not completed', e);
  }
});
</script>
