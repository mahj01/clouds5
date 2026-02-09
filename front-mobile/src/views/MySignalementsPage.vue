<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/home" />
        </IonButtons>
        <IonTitle>Mes signalements</IonTitle>
      </IonToolbar>

      <IonToolbar>
        <IonItem lines="none">
          <IonLabel>Filtrer par statut</IonLabel>
          <IonSelect v-model="selectedStatut" interface="popover" placeholder="Tous">
            <IonSelectOption value="all">Tous</IonSelectOption>
            <IonSelectOption value="nouveau">nouveau</IonSelectOption>
            <IonSelectOption value="en_cours">en_cours</IonSelectOption>
            <IonSelectOption value="cloture">cloture</IonSelectOption>
          </IonSelect>
        </IonItem>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">
      <IonRefresher slot="fixed" @ionRefresh="onRefresh">
        <IonRefresherContent />
      </IonRefresher>

      <IonText v-if="error" color="danger" class="block-msg">{{ error }}</IonText>

      <IonList v-if="items.length" lines="full">
        <IonItem v-for="s in items" :key="s.id" button @click="openDetails(s)">
          <IonLabel>
            <div class="row">
              <strong>{{ s.statut }}</strong>
              <span class="mono">{{ s.id }}</span>
            </div>
            <div class="sub">{{ s.titre || '-' }}</div>
            <div class="sub">{{ formatDate(s.date_signalement_ms) }}</div>
            <div class="sub">{{ s.latitude }}, {{ s.longitude }} | surface={{ s.surface_m2 ?? '-' }}</div>
            <div class="sub">{{ s.description || '-' }}</div>
          </IonLabel>
        </IonItem>
      </IonList>

      <IonText v-else-if="!loading" color="medium" class="block-msg">Aucun signalement.</IonText>

      <IonSpinner v-if="loading" />

      <IonModal :is-open="detailsOpen" @didDismiss="detailsOpen = false">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Détails</IonTitle>
            <IonButtons slot="end">
              <IonButton @click="detailsOpen = false">Fermer</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent class="ion-padding">
          <div v-if="selected" class="details">
            <div><strong>ID:</strong> <span class="mono">{{ selected.id }}</span></div>
            <div><strong>Statut:</strong> {{ selected.statut }}</div>
            <div><strong>Titre:</strong> {{ selected.titre || '-' }}</div>
            <div><strong>Type:</strong> {{ selected.type_signalement || '-' }}</div>
            <div><strong>Description:</strong> {{ selected.description || '-' }}</div>
            <div><strong>Surface:</strong> {{ selected.surface_m2 ?? '-' }}</div>
            <div><strong>Latitude:</strong> {{ selected.latitude }}</div>
            <div><strong>Longitude:</strong> {{ selected.longitude }}</div>
            <div><strong>Date:</strong> {{ formatDate(selected.date_signalement_ms) }}</div>
          </div>
        </IonContent>
      </IonModal>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'

import {
  applySignalementDiffs,
  fetchMySignalementsFromServer,
  subscribeMySignalements,
  type FirestoreSignalement,
  type SignalementStatutFilter,
} from '@/services/signalementsFirestore'

const loading = ref(false)
const error = ref('')

const selectedStatut = ref<SignalementStatutFilter>('all')

const byId = new Map<string, FirestoreSignalement>()
const items = ref<FirestoreSignalement[]>([])

let unsubscribe: null | (() => void) = null

const detailsOpen = ref(false)
const selected = ref<FirestoreSignalement | null>(null)

function formatDate(ms: number | null) {
  if (!ms) return '-'
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return '-'
  }
}

function openDetails(s: FirestoreSignalement) {
  selected.value = s
  detailsOpen.value = true
}

function resubscribe() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }

  error.value = ''
  unsubscribe = subscribeMySignalements(
    { statut: selectedStatut.value },
    (diffs) => {
      items.value = applySignalementDiffs(byId, diffs)
    },
    (err) => {
      error.value = err instanceof Error ? err.message : String(err)
    },
  )
}

async function forceFetchOnce() {
  loading.value = true
  error.value = ''
  try {
    const list = await fetchMySignalementsFromServer({ statut: selectedStatut.value })
    byId.clear()
    for (const s of list) byId.set(s.id, s)
    // Optional: show most recent first if date exists.
    items.value = list
      .slice()
      .sort((a, b) => (b.date_signalement_ms ?? 0) - (a.date_signalement_ms ?? 0))
  } catch (e: any) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev: CustomEvent) {
  await forceFetchOnce()
  ;(ev as any).detail?.complete?.()
}

watch(selectedStatut, async () => {
  // Reset list to avoid mixing statuses.
  byId.clear()
  items.value = []
  resubscribe()
  await forceFetchOnce()
})

onMounted(async () => {
  resubscribe()
  await forceFetchOnce()
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
  unsubscribe = null
})
</script>

<style scoped>
.block-msg {
  display: block;
  margin: 10px 0 14px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.sub {
  font-size: 12px;
  color: #666;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
</style>

