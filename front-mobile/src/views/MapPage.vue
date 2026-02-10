<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Offline Map</IonTitle>
        <IonButtons slot="end">
          <!-- Manual refresh: kept lightweight + guarded in script -->
          <IonButton :disabled="isRefreshing" @click="onManualRefresh">
            {{ isRefreshing ? '...' : 'Rafraîchir' }}
          </IonButton>
          <IonButton @click="$router.push('/recap-signalements')">Récap</IonButton>
          <IonButton @click="$router.push('/home')">Home</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div id="map" style="height: 100%;"></div>

      <!-- Instruction banner when picking location -->
      <Transition name="slide-down">
        <div v-if="pickingLocation && !validationPromptVisible" class="picking-banner">
          <span class="picking-icon">📍</span>
          <span class="picking-text">Touchez la carte pour choisir la position</span>
        </div>
      </Transition>
    </IonContent>

    <IonModal :is-open="modalOpen" @didDismiss="onModalDismiss">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Nouveau signalement</IonTitle>
          <IonButtons slot="start">
            <IonButton @click="onBackToLocationPicking">
              <span style="font-size: 20px;">←</span>
              Retour
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton @click="onCancelFlow" color="danger">Annuler</IonButton>
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

    <FloatingButton
      :is-cancel="pickingLocation"
      @click="handleFloatingButtonClick"
    />

    <ValidationPrompt
      :visible="validationPromptVisible"
      :message="validationMessage"
      :latitude="selectedLocation?.lat"
      :longitude="selectedLocation?.lng"
      @confirm="confirmLocation"
      @cancel="cancelLocationSelection"
    />
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
import FloatingButton from '@/components/FloatingButton.vue';
import ValidationPrompt from '@/components/ValidationPrompt.vue';
import {
  applySignalementDiffs,
  loadSignalementCache,
  subscribeSignalements,
  fetchSignalementsFromServer,
  type FirestoreSignalement,
  type SignalementDiff,
} from '@/services/signalementsFirestore'
import { mapRefreshService } from '@/services/map-refresh'
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

// Refresh state (manual + polling share the same function)
const isRefreshing = ref(false)

const detailsOpen = ref(false)
const selected = ref<FirestoreSignalement | null>(null)

const hasPickedLocation = computed(() => pickedLat.value != null && pickedLng.value != null)

const loggedInUserId = computed(() => {
  const raw = localStorage.getItem('auth_user_id') || ''
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : 0
})

const validationPromptVisible = ref(false)
const validationMessage = ref('')

type PickedLocation = { lng: number; lat: number }
const selectedLocation = ref<PickedLocation | null>(null)

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

async function refreshMapData(options?: { showSuccessToast?: boolean }) {
  if (!map) return
  if (isRefreshing.value) return

  console.log('[MapPage] refreshMapData triggered', {
    at: new Date().toISOString(),
    via: options?.showSuccessToast ? 'manual' : 'auto',
  })

  isRefreshing.value = true
  try {
    // 1) Force a server snapshot (cheap enough at low frequency).
    // This helps when Firestore listeners were interrupted or when returning from background.
    const serverItems = await fetchSignalementsFromServer()

    // Replace local state with server snapshot
    signalementsById.clear()
    for (const it of serverItems) {
      signalementsById.set(it.id, it)
    }

    // Re-render markers from scratch (avoids duplicates / stale positions)
    clearAllSignalementMarkers()
    for (const it of serverItems) {
      upsertMarker(it)
    }

    // 2) Re-subscribe to realtime diffs (if the previous subscription was dropped).
    if (unsubscribeSignalements) {
      unsubscribeSignalements()
      unsubscribeSignalements = null
    }
    unsubscribeSignalements = subscribeSignalements(
      (diffs) => {
        applyDiffs(diffs)
      },
      (err) => {
        const msg = err instanceof Error ? err.message : String(err)
        showToast(`Firestore error: ${msg}`)
      },
    )

    if (options?.showSuccessToast) showToast('Carte mise à jour')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    showToast(`Rafraîchissement impossible: ${msg}`)
  } finally {
    isRefreshing.value = false
  }
}

function onManualRefresh() {
  void refreshMapData({ showSuccessToast: true })
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
  cleanupMarker()
}

function cleanupMarker() {
  if (marker) {
    marker.remove()
    marker = undefined
  }
  pickedLat.value = null
  pickedLng.value = null
  selectedLocation.value = null
}

function onCancelFlow() {
  // Complete exit from the flow
  modalOpen.value = false
  pickingLocation.value = false
  validationPromptVisible.value = false
  cleanupMarker()
}

function onModalDismiss() {
  // When modal is dismissed (swipe down, back button), treat as cancel
  if (modalOpen.value) {
    onCancelFlow()
  }
}

function onBackToLocationPicking() {
  // Go back to location picking mode
  modalOpen.value = false
  pickingLocation.value = true
  cleanupMarker()
  showToast('Touchez la carte pour choisir une autre position')
}

function handleFloatingButtonClick() {
  if (pickingLocation.value) {
    // Cancel the flow
    onCancelFlow()
    showToast('Signalement annulé')
  } else {
    // Start the flow
    startAjoutSignalementFlow()
  }
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

function startAjoutSignalementFlow() {
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

function confirmLocation() {
  pickingLocation.value = false
  validationPromptVisible.value = false
  const loc = selectedLocation.value
  if (!loc) return

  pickedLng.value = loc.lng
  pickedLat.value = loc.lat

  // pickedLng/pickedLat are definitely set here
  const lng = loc.lng
  const lat = loc.lat

  if (!marker) {
    marker = new maplibregl.Marker({ color: '#e11d48' }).setLngLat([lng, lat]).addTo(map)
  } else {
    marker.setLngLat([lng, lat])
  }
  modalOpen.value = true
}

function cancelLocationSelection() {
  // User wants to pick a different location, remove temp marker and keep listening
  validationPromptVisible.value = false
  if (marker) {
    marker.remove()
    marker = undefined
  }
  selectedLocation.value = null
}

function handleMapClick(e: any) {
  if (!pickingLocation.value) return

  const lng = Number(e?.lngLat?.lng)
  const lat = Number(e?.lngLat?.lat)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

  // Show temporary marker at clicked location
  if (!marker) {
    marker = new maplibregl.Marker({ color: '#e11d48' }).setLngLat([lng, lat]).addTo(map)
  } else {
    marker.setLngLat([lng, lat])
  }

  selectedLocation.value = { lng, lat }
  validationMessage.value = 'Est-ce la bonne position ?'
  validationPromptVisible.value = true
}

function clearAllSignalementMarkers() {
  for (const m of markersById.values()) {
    try {
      m.remove?.()
    } catch {
      // ignore
    }
  }
  markersById.clear()
}

function clearMapResources() {
  // Stop firestore subscription
  if (unsubscribeSignalements) {
    unsubscribeSignalements()
    unsubscribeSignalements = null
  }

  // Remove per-signalement markers
  clearAllSignalementMarkers()

  // Remove temp marker
  if (marker) {
    try {
      marker.remove?.()
    } catch {
      // ignore
    }
    marker = undefined
  }

  // Remove user marker
  if (userLocationMarker) {
    try {
      userLocationMarker.remove?.()
    } catch {
      // ignore
    }
    userLocationMarker = null
  }

  // Remove map instance so next enter starts fresh
  if (map) {
    try {
      map.off?.('click', handleMapClick)
      map.remove?.()
    } catch {
      // ignore
    }
    map = null
  }

  // Keep data maps fresh too
  signalementsById.clear()
}

onIonViewDidEnter(() => {
  // If we come back to this view from another route, Ionic may reuse the component.
  // Make sure we start clean and always re-render markers.
  clearMapResources()

  map = new maplibregl.Map({
    container: 'map',
    style: 'http://127.0.0.1:8080/style.json',
    center: [47.5245, -18.8985],
    zoom: 12
  });

  map.on('click', handleMapClick);

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

  // 3) Low-frequency refresh while the map is open.
  // Uses a singleton service so we don't accidentally create multiple intervals.
  mapRefreshService.start(
    () => refreshMapData(),
    { intervalMs: 90_000, runImmediately: false },
  )
});

onIonViewWillLeave(() => {
  mapRefreshService.stop()
  clearMapResources()
})

onBeforeUnmount(() => {
  mapRefreshService.stop()
  clearMapResources()
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
  font-size: 13px;
  color: #64748b;
}

/* Details panel */
.details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.details > div {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.details > div strong {
  color: #475569;
  font-weight: 600;
  min-width: 90px;
  flex-shrink: 0;
}

/* Picking banner styles */
.picking-banner {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.97) 0%, rgba(29, 78, 216, 0.97) 100%);
  color: white;
  padding: 14px 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
  backdrop-filter: blur(8px);
}

.picking-icon {
  font-size: 22px;
  animation: bounce 1.2s ease-in-out infinite;
}

.picking-text {
  white-space: nowrap;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* Slide down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-24px);
}

/* Dark mode details */
@media (prefers-color-scheme: dark) {
  .details > div {
    background: #1e293b;
  }

  .details > div strong {
    color: #94a3b8;
  }
}
</style>
