<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'

import {
  applySignalementDiffs,
  fetchSignalementsFromServer,
  loadSignalementCache,
  subscribeSignalements,
  type FirestoreSignalement,
} from '@/services/signalementsFirestore'

import {
  buildTypeFromSignalement,
  computeRecapKpis,
  filterSignalements,
  type RecapFilters,
  type SignalementStatut,
} from '@/services/recap-signalement'

const loading = ref(false)
const error = ref('')
const info = ref('')

const byId = new Map<string, FirestoreSignalement>()
for (const s of loadSignalementCache()) byId.set(s.id, s)

const items = ref<FirestoreSignalement[]>(Array.from(byId.values()))

const filters = ref<RecapFilters>({ statut: 'all', type: 'all' })

const allTypes = computed(() => {
  const set = new Set<string>()
  for (const s of items.value) set.add(buildTypeFromSignalement(s))
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filteredItems = computed(() => filterSignalements(items.value, filters.value))
const kpis = computed(() => computeRecapKpis(filteredItems.value))

const progressPct = computed(() => {
  const v = kpis.value.progress.overallPct
  return Math.max(0, Math.min(100, v))
})

const progressBarValue = computed(() => progressPct.value / 100)

const statusLabel: Record<SignalementStatut, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  cloture: 'Clôturé',
  autre: 'Autre',
}

function labelForStatus(key: string) {
  if (key === 'nouveau') return statusLabel.nouveau
  if (key === 'en_cours') return statusLabel.en_cours
  if (key === 'cloture') return statusLabel.cloture
  return statusLabel.autre
}

function formatMoney(value: number | null) {
  if (value == null) return '-'
  try {
    return value.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })
  } catch {
    return `${value} €`
  }
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
    info.value = `Fetch server OK: ${list.length} docs`
  } catch (e: any) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

let unsubscribe: null | (() => void) = null

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

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/home" />
        </IonButtons>
        <IonTitle>Récapitulatif signalements</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="forceFetch" :disabled="loading">Actualiser</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">
      <IonText v-if="error" color="danger" class="block-msg">{{ error }}</IonText>
      <IonText v-else-if="info" color="medium" class="block-msg">{{ info }}</IonText>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Filtres</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList lines="full">
            <IonItem>
              <IonLabel>Statut</IonLabel>
              <IonSelect interface="popover" v-model="filters.statut" placeholder="Tous">
                <IonSelectOption value="all">Tous</IonSelectOption>
                <IonSelectOption value="nouveau">Nouveau</IonSelectOption>
                <IonSelectOption value="en_cours">En cours</IonSelectOption>
                <IonSelectOption value="cloture">Clôturé</IonSelectOption>
                <IonSelectOption value="autre">Autre</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Type</IonLabel>
              <IonSelect interface="popover" v-model="filters.type" placeholder="Tous">
                <IonSelectOption value="all">Tous</IonSelectOption>
                <IonSelectOption v-for="t in allTypes" :key="t" :value="t">{{ t }}</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      <div v-if="loading" class="loading-row">
        <IonSpinner name="crescent" />
        <IonText color="medium">Chargement…</IonText>
      </div>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Indicateurs</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div class="kpi-grid">
            <div class="kpi">
              <div class="kpi-label">Total (après filtre)</div>
              <div class="kpi-value">{{ kpis.totalCount }}</div>
            </div>

            <div class="kpi">
              <div class="kpi-label">Avancement global</div>
              <div class="kpi-value">{{ Math.round(progressPct) }}%</div>
              <IonProgressBar :value="progressBarValue" />
            </div>

            <div class="kpi">
              <div class="kpi-label">Budget total</div>
              <div class="kpi-value">{{ formatMoney(kpis.budget.total) }}</div>
            </div>

            <div class="kpi">
              <div class="kpi-label">Budget moyen</div>
              <div class="kpi-value">{{ formatMoney(kpis.budget.average) }}</div>
              <div class="kpi-sub">{{ kpis.budget.countWithBudget }} avec budget</div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Répartition par statut</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList lines="none">
            <IonItem v-for="(count, st) in kpis.progress.countsByStatut" :key="st">
              <IonLabel>{{ labelForStatus(st) }}</IonLabel>
              <IonText color="medium">{{ count }}</IonText>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Répartition par type</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText v-if="Object.keys(kpis.countsByType).length === 0" color="medium">
            Aucun élément.
          </IonText>

          <IonList v-else lines="none">
            <IonItem v-for="(count, t) in kpis.countsByType" :key="t">
              <IonLabel>{{ t }}</IonLabel>
              <IonText color="medium">{{ count }}</IonText>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonText v-if="!loading && filteredItems.length === 0" color="medium" class="block-msg">
        Aucun signalement pour ces filtres.
      </IonText>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.block-msg {
  display: block;
  margin: 14px 4px 18px;
  font-size: 14px;
  line-height: 1.5;
}

.loading-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 12px 0 20px;
  padding: 16px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.kpi {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 3px 3px 0 0;
}

.kpi:nth-child(2)::before {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.kpi:nth-child(3)::before {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.kpi:nth-child(4)::before {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-value {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  margin-bottom: 8px;
}

.kpi-sub {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

ion-progress-bar {
  border-radius: 6px;
  height: 8px !important;
  margin-top: 4px;
}

@media (max-width: 360px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  .kpi {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: #334155;
  }

  .kpi-value {
    color: #f1f5f9;
  }

  .kpi-label {
    color: #94a3b8;
  }
}
</style>