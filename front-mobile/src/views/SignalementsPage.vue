<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Signalements (debug)</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="forceFetch" :disabled="loading">Force fetch</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">
      <IonText color="medium" class="meta">
        Cache: {{ cachedCount }} | Mémoire: {{ items.length }}
      </IonText>

      <IonText color="medium" class="meta">
        Projet: {{ projectId || '-' }} | Collection: {{ collectionName }}
      </IonText>

      <div class="actions">
        <IonButton size="small" @click="createDebugDoc" :disabled="loading">Créer doc debug</IonButton>
      </div>

      <IonText v-if="error" color="danger" class="block-msg">{{ error }}</IonText>
      <IonText v-else-if="info" color="medium" class="block-msg">{{ info }}</IonText>

      <IonList v-if="items.length" lines="full">
        <IonItem button v-for="s in items" :key="s.id" @click="openDetails(s)">
          <IonLabel>
            <div class="row">
              <strong>{{ s.statut }}</strong>
              <span class="mono">{{ s.id }}</span>
            </div>
            <div class="sub">{{ formatDate(s.date_signalement_ms) }}</div>
            <div class="sub">{{ s.latitude }}, {{ s.longitude }} | surface={{ s.surface ?? '-' }}</div>
            <div class="sub">{{ s.description || '-' }}</div>
          </IonLabel>
        </IonItem>
      </IonList>

      <IonText v-else color="medium" class="block-msg">Aucun signalement.</IonText>
    </IonContent>

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
          <div><strong>Description:</strong> {{ selected.description || '-' }}</div>
          <div><strong>Surface:</strong> {{ selected.surface ?? '-' }}</div>
          <div><strong>Latitude:</strong> {{ selected.latitude }}</div>
          <div><strong>Longitude:</strong> {{ selected.longitude }}</div>
          <div><strong>Date:</strong> {{ formatDate(selected.date_signalement_ms) }}</div>
        </div>
      </IonContent>
    </IonModal>
  </IonPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'

import {
  applySignalementDiffs,
  createSignalementInFirestore,
  fetchSignalementsFromServer,
  loadSignalementCache,
  SIGNALMENT_COLLECTION,
  subscribeSignalements,
  type FirestoreSignalement,
} from '@/services/signalementsFirestore'

import { auth, db } from '@/firebase'

const loading = ref(false)
const error = ref('')
const info = ref('')

const cached = loadSignalementCache()
const cachedCount = ref(cached.length)

const collectionName = SIGNALMENT_COLLECTION
const projectId = (db as any)?.app?.options?.projectId ?? ''

const byId = new Map<string, FirestoreSignalement>()
for (const s of cached) byId.set(s.id, s)

const items = ref<FirestoreSignalement[]>(Array.from(byId.values()))

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

async function forceFetch() {
  loading.value = true
  error.value = ''
  info.value = ''
  try {
    const list = await fetchSignalementsFromServer()
    byId.clear()
    for (const s of list) byId.set(s.id, s)
    items.value = list
    cachedCount.value = loadSignalementCache().length
    info.value = `Fetch server OK: ${list.length} docs`
  } catch (e: any) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function createDebugDoc() {
  loading.value = true
  error.value = ''
  info.value = ''
  try {
    await createSignalementInFirestore({
      description: `DEBUG ${new Date().toISOString()}`,
      surface: 1,
      latitude: 0,
      longitude: 0,
    })
    info.value = 'Doc debug créé. Rafraîchissement…'
    await forceFetch()
  } catch (e: any) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  unsubscribe = subscribeSignalements(
    (diffs) => {
      items.value = applySignalementDiffs(byId, diffs)
    },
    (err) => {
      error.value = err instanceof Error ? err.message : String(err)
    },
  )
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})
</script>

<style scoped>
.meta {
  display: block;
  margin-bottom: 8px;
}

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
