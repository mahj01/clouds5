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
  margin: 14px 4px 18px;
  font-size: 14px;
  line-height: 1.5;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.row strong {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  background: #eff6ff;
  color: #2563eb;
  letter-spacing: 0.01em;
}

.sub {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin-top: 2px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

/* Details panel */
.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.details > div {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.details > div strong {
  color: #475569;
  font-weight: 600;
  min-width: 100px;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .row strong {
    background: #1e3a5f;
    color: #60a5fa;
  }

  .mono {
    background: #1e293b;
    color: #64748b;
  }

  .details > div {
    background: #1e293b;
  }

  .details > div strong {
    color: #94a3b8;
  }
}
</style>

