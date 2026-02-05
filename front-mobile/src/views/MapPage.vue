<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Offline Map</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="$router.push('/home')">Home</IonButton>
          <IonButton @click="startSignalementFlow" :disabled="!loggedInUserId">
            {{ pickingLocation ? 'Choisir position…' : 'Ajouter signalement' }}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div id="map" style="height: 100%;"></div>
    </IonContent>

    <IonModal :is-open="modalOpen" @didDismiss="onCancel">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Nouveau signalement</IonTitle>
          <IonButtons slot="end">
            <IonButton @click="onCancel">Annuler</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent class="ion-padding">
        <Signalement
          mode="map"
          :initial-latitude="pickedLat!"
          :initial-longitude="pickedLng!"
          :utilisateur-id="loggedInUserId"
          @created="onCreated"
        />
      </IonContent>
    </IonModal>

    <IonModal :is-open="detailsOpen" @didDismiss="detailsOpen = false">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Détails signalement</IonTitle>
          <IonButtons slot="end">
            <IonButton @click="detailsOpen = false">Fermer</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent class="ion-padding">
        <div v-if="selected" class="details">
          <div><strong>Statut:</strong> {{ selected.statut }}</div>
          <div><strong>Description:</strong> {{ selected.description || '-' }}</div>
          <div><strong>Surface:</strong> {{ selected.surface_m2 ?? '-' }}</div>
          <div><strong>Latitude:</strong> {{ selected.latitude }}</div>
          <div><strong>Longitude:</strong> {{ selected.longitude }}</div>
          <div><strong>Date:</strong> {{ formatDate(selected.date_signalement_ms) }}</div>
        </div>
      </IonContent>
    </IonModal>

    <IonToast :is-open="toastOpen" :message="toastMessage" :duration="2200" @didDismiss="toastOpen = false" />
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  onIonViewDidEnter,
  onIonViewWillLeave,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonModal,
  IonToast,
} from '@ionic/vue'
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import Signalement from '@/components/Signalement.vue'
import {
  applySignalementDiffs,
  loadSignalementCache,
  subscribeSignalements,
  type FirestoreSignalement,
  type SignalementDiff,
} from '@/services/signalementsFirestore'
import { Geolocation } from '@capacitor/geolocation';


let map: any;
let marker: any;
let userLocationMarker: any = null;


const markersById = new Map<string, any>()
const signalementsById = new Map<string, FirestoreSignalement>()
let unsubscribeSignalements: null | (() => void) = null

const pickedLat = ref<number | null>(null)
const pickedLng = ref<number | null>(null)
const modalOpen = ref(false)
const pickingLocation = ref(false)

const toastOpen = ref(false)
const toastMessage = ref('')

const detailsOpen = ref(false)
const selected = ref<FirestoreSignalement | null>(null)

const hasPickedLocation = computed(() => pickedLat.value != null && pickedLng.value != null)

const loggedInUserId = computed(() => {
  const raw = localStorage.getItem('auth_user_id') || ''
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : 0
})

async function showUserLocation() {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const { latitude, longitude } = position.coords;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    // Create or update marker
    if (!userLocationMarker) {
      userLocationMarker = new maplibregl.Marker({ color: '#dc2626' }) // red
          .setLngLat([longitude, latitude])
          .addTo(map);
    } else {
      userLocationMarker.setLngLat([longitude, latitude]);
    }

    // Optional: center map on user
    map.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      speed: 0.6,
    });

  } catch (err) {
    console.warn('Unable to get user location', err);
    showToast('Impossible d’obtenir la position GPS');
  }
}

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

function formatDate(ms: number | null) {
  if (!ms) return '-'
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return '-'
  }
}

function upsertMarker(item: FirestoreSignalement) {
  if (!map) return
  if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return

  const existing = markersById.get(item.id)
  if (existing) {
    existing.setLngLat([item.longitude, item.latitude])
    return
  }

  const m = new maplibregl.Marker({ color: '#2563eb' }).setLngLat([item.longitude, item.latitude]).addTo(map)
  m.getElement().addEventListener('click', (ev: any) => {
    ev?.stopPropagation?.()
    selected.value = item
    detailsOpen.value = true
  })
  markersById.set(item.id, m)
}

function removeMarker(id: string) {
  const m = markersById.get(id)
  if (!m) return
  m.remove()
  markersById.delete(id)
}

function applyDiffs(diffs: SignalementDiff[]) {
  const items = applySignalementDiffs(signalementsById, diffs)
  for (const d of diffs) {
    if (d.type === 'removed') {
      removeMarker(d.id)
      if (selected.value?.id === d.id) {
        selected.value = null
        detailsOpen.value = false
      }
    } else {
      upsertMarker(d.item)
    }
  }
  // If the selected item was modified, refresh it from map
  if (selected.value) {
    const refreshed = signalementsById.get(selected.value.id)
    if (refreshed) selected.value = refreshed
  }
}

function startSignalementFlow() {
  if (!loggedInUserId.value) {
    showToast("Utilisateur non détecté. Connectez-vous d'abord.")
    return
  }

  // Flow: click button -> click on map -> modal form -> submit/cancel
  pickingLocation.value = true
  modalOpen.value = false
  pickedLat.value = null
  pickedLng.value = null
  if (marker) {
    marker.remove()
    marker = undefined
  }
  showToast('Touchez la carte pour choisir la position')
}

function onCreated() {
  showToast('Signalement créé')
  modalOpen.value = false
  pickingLocation.value = false
}

function onCancel() {
  modalOpen.value = false
  pickingLocation.value = false
  pickedLat.value = null
  pickedLng.value = null
  if (marker) {
    marker.remove()
    marker = undefined
  }
}

onIonViewDidEnter(() => {
  map = new maplibregl.Map({
    container: 'map',
    style: 'http://127.0.0.1:8080/style.json',
    center: [47.5245, -18.8985],
    zoom: 12
  });

  map.on('click', (e: any) => {
    if (!pickingLocation.value) return

    const lng = Number(e?.lngLat?.lng)
    const lat = Number(e?.lngLat?.lat)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

    pickedLng.value = lng
    pickedLat.value = lat

    if (!marker) {
      marker = new maplibregl.Marker({ color: '#e11d48' }).setLngLat([lng, lat]).addTo(map)
    } else {
      marker.setLngLat([lng, lat])
    }

    pickingLocation.value = false
    modalOpen.value = true
  })

  // 1) Load cached signalements and render them immediately
  const cached = loadSignalementCache()
  for (const it of cached) {
    signalementsById.set(it.id, it)
    upsertMarker(it)
  }

  map.on('load', async () => {
    await showUserLocation();
  });


  // 2) Subscribe to Firestore updates (diffs) to avoid refetching everything
  unsubscribeSignalements = subscribeSignalements(
    (diffs) => {
      applyDiffs(diffs)
    },
    (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(`Firestore error: ${msg}`)
    },
  )
});

onIonViewWillLeave(() => {
  if (unsubscribeSignalements) {
    unsubscribeSignalements()
    unsubscribeSignalements = null
  }
})

onBeforeUnmount(() => {
  if (unsubscribeSignalements) {
    unsubscribeSignalements()
    unsubscribeSignalements = null
  }
})
</script>

<style>
#map {
  width: 100%;
  height: 100%;
}

.hint {
  display: block;
  margin-bottom: 12px;
}
</style>
