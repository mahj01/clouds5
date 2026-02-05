<template>
	<IonCard class="signalement-card">
		<IonCardHeader>
			<IonCardTitle>Créer un signalement</IonCardTitle>
			<IonCardSubtitle v-if="mode === 'full'">
				API: <span class="mono">{{ apiBase }}</span>
			</IonCardSubtitle>
			<IonCardSubtitle v-else>
				<span class="mono">Firebase Firestore</span>
			</IonCardSubtitle>
		</IonCardHeader>

		<IonCardContent>
			<IonList lines="full">
				<IonItem v-if="mode === 'full'">
					<IonInput v-model="titre" label="Titre" label-placement="stacked" placeholder="Ex: Dépôt sauvage" />
				</IonItem>

				<IonItem>
					<IonTextarea
						v-model="description"
						label="Description"
						label-placement="stacked"
						auto-grow
						placeholder="Décrivez le signalement…"
					/>
				</IonItem>

				<IonItem v-if="mode === 'full'">
					<IonSelect v-model="statut" label="Statut" label-placement="stacked" interface="popover">
						<IonSelectOption value="nouveau">nouveau</IonSelectOption>
						<IonSelectOption value="en_cours">en_cours</IonSelectOption>
						<IonSelectOption value="cloture">cloture</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="latitude"
						:readonly="mode === 'map'"
						label="Latitude"
						label-placement="stacked"
						inputmode="decimal"
						placeholder="Ex: -18.898500"
					/>
				</IonItem>
				<IonItem>
					<IonInput
						v-model="longitude"
						:readonly="mode === 'map'"
						label="Longitude"
						label-placement="stacked"
						inputmode="decimal"
						placeholder="Ex: 47.524500"
					/>
				</IonItem>

				<div v-if="mode === 'full'" class="row">
					<IonButton size="small" fill="outline" @click="fillWithCurrentLocation" :disabled="busy">
						Utiliser ma position
					</IonButton>
					<IonText color="medium" class="hint">Sur émulateur Android: préférez 10.0.2.2</IonText>
				</div>

				<IonItem>
					<IonInput
						v-model="surfaceM2"
						label="Surface (m²)"
						label-placement="stacked"
						inputmode="decimal"
						placeholder="Optionnel"
					/>
				</IonItem>

				<IonItem v-if="mode === 'full'">
					<IonInput
						v-model="budget"
						label="Budget"
						label-placement="stacked"
						inputmode="decimal"
						placeholder="Optionnel"
					/>
				</IonItem>

				<IonItem v-if="mode === 'full'">
					<IonInput
						v-model="utilisateurId"
						label="Utilisateur ID"
						label-placement="stacked"
						inputmode="numeric"
						placeholder="Ex: 1"
					/>
				</IonItem>

				<IonItem v-if="mode === 'full'">
					<IonInput
						v-model="entrepriseId"
						label="Entreprise ID"
						label-placement="stacked"
						inputmode="numeric"
						placeholder="Optionnel"
					/>
				</IonItem>
			</IonList>

			<IonText v-if="error" color="danger" class="block-msg">{{ error }}</IonText>
			<IonText v-else-if="info" color="medium" class="block-msg">{{ info }}</IonText>

			<div class="actions">
				<IonButton expand="block" @click="submit" :disabled="busy">
					{{ busy ? 'Envoi…' : 'Envoyer' }}
				</IonButton>
				<IonButton v-if="mode === 'full'" expand="block" fill="clear" @click="ensureVisitorSession" :disabled="busy">
					Obtenir un token visiteur
				</IonButton>
			</div>
		</IonCardContent>
	</IonCard>

	<IonToast :is-open="toastOpen" :message="toastMessage" :duration="2200" @didDismiss="toastOpen = false" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonInput,
	IonItem,
	IonList,
	IonSelect,
	IonSelectOption,
	IonText,
	IonTextarea,
	IonToast,
} from '@ionic/vue'

import { createSignalementInFirestore } from '@/services/signalementsFirestore'

type VisitorLoginResponse = {
	token: string
	expiresAt: string
	user?: { id?: number }
}

type CreateSignalementPayload = {
	titre?: string
	description?: string
	latitude: number
	longitude: number
	statut?: string
	surfaceM2?: number
	budget?: number
	utilisateurId: number
	entrepriseId?: number
}

const props = withDefaults(
	defineProps<{
		mode?: 'full' | 'map'
		initialLatitude?: number
		initialLongitude?: number
		utilisateurId?: number
	}>(),
	{ mode: 'full' },
)

const emit = defineEmits<{
	(e: 'created', value: unknown): void
}>()

const apiBase = computed(() => (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001')
const mode = computed(() => props.mode)

const titre = ref('')
const description = ref('')
const statut = ref<'nouveau' | 'en_cours' | 'cloture'>('nouveau')
const latitude = ref('')
const longitude = ref('')
const surfaceM2 = ref('')
const budget = ref('')
const utilisateurId = ref('')
const entrepriseId = ref('')

const busy = ref(false)
const error = ref('')
const info = ref('')

const toastOpen = ref(false)
const toastMessage = ref('')

function showToast(message: string) {
	toastMessage.value = message
	toastOpen.value = true
}

function getStoredToken() {
	return localStorage.getItem('auth_token') || ''
}

function getStoredExpiry() {
	return localStorage.getItem('auth_expiresAt') || ''
}

function getStoredUserId() {
	return localStorage.getItem('auth_user_id') || ''
}

function isExpiryValid(expiresAt: string) {
	if (!expiresAt) return false
	const exp = new Date(expiresAt).getTime()
	if (Number.isNaN(exp)) return false
	return exp > Date.now() + 10_000 // 10s safety margin
}

async function apiFetch(path: string, options: RequestInit = {}, token?: string) {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as any),
	}
	if (token) headers.Authorization = `Bearer ${token}`

	let res: Response
	try {
		res = await fetch(`${apiBase.value}${path}`, { ...options, headers })
	} catch {
		throw new Error('Impossible de contacter le serveur (hors ligne ?).')
	}

	if (!res.ok) {
		let message = `Erreur ${res.status}`
		try {
			const data = await res.json()
			if (data?.message) {
				message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message)
			}
		} catch {
			// ignore
		}
		throw new Error(message)
	}

	if (res.status === 204) return null
	try {
		return await res.json()
	} catch {
		return null
	}
}

async function ensureVisitorSession() {
	error.value = ''
	info.value = ''

	const existingToken = getStoredToken()
	const existingExpiry = getStoredExpiry()
	if (existingToken && isExpiryValid(existingExpiry)) {
		info.value = 'Session existante détectée.'
		if (!utilisateurId.value) {
			const uid = getStoredUserId()
			if (uid) utilisateurId.value = uid
		}
		return { token: existingToken, userId: Number(getStoredUserId() || 0) }
	}

	const resp = (await apiFetch('/auth/visiteur', { method: 'POST' })) as VisitorLoginResponse
	if (!resp?.token || !resp?.expiresAt) throw new Error('Réponse invalide du serveur (visiteur).')

	localStorage.setItem('auth_token', resp.token)
	localStorage.setItem('auth_expiresAt', resp.expiresAt)
	if (resp.user?.id != null) {
		localStorage.setItem('auth_user_id', String(resp.user.id))
	}

	if (!utilisateurId.value && resp.user?.id != null) {
		utilisateurId.value = String(resp.user.id)
	}

	info.value = 'Session visiteur créée.'
	showToast('Token visiteur OK')
	return { token: resp.token, userId: resp.user?.id ?? 0 }
}

async function fillWithCurrentLocation() {
	error.value = ''

	if (!('geolocation' in navigator)) {
		error.value = "La géolocalisation n'est pas disponible sur cet appareil."
		return
	}

	busy.value = true
	try {
		const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				(pos) => resolve(pos.coords),
				(err) => reject(err),
				{ enableHighAccuracy: true, timeout: 10_000 },
			)
		})
		latitude.value = String(coords.latitude)
		longitude.value = String(coords.longitude)
		showToast('Position récupérée')
	} catch (e: any) {
		error.value = e?.message ? String(e.message) : 'Impossible de récupérer la position.'
	} finally {
		busy.value = false
	}
}

function toOptionalNumber(v: string) {
	const trimmed = v.trim()
	if (!trimmed) return undefined
	const n = Number(trimmed)
	return Number.isFinite(n) ? n : undefined
}

function toRequiredNumber(v: string, label: string) {
	const n = Number(v)
	if (!Number.isFinite(n)) throw new Error(`${label} est invalide.`)
	return n
}

async function submit() {
	error.value = ''
	info.value = ''
	busy.value = true

	try {
		// Map mode: write directly to Firestore (no REST API)
		if (mode.value === 'map') {
			const lat = toRequiredNumber(latitude.value, 'Latitude')
			const lng = toRequiredNumber(longitude.value, 'Longitude')
			await createSignalementInFirestore({
				description: description.value.trim() || undefined,
				surfaceM2: toOptionalNumber(surfaceM2.value),
				latitude: lat,
				longitude: lng,
			})

			showToast('Signalement créé')
			emit('created', { latitude: lat, longitude: lng })
			return
		}

		let token = getStoredToken()
		const expiry = getStoredExpiry()
		if (!token || !isExpiryValid(expiry)) {
			// In map mode we expect the user to be logged-in, but we still allow fallback to a visitor session
			// so the feature is usable during development.
			const session = await ensureVisitorSession()
			token = session.token
		}

		const uid = Number(utilisateurId.value)
		if (!Number.isInteger(uid) || uid <= 0) throw new Error('Utilisateur ID est requis (entier > 0).')

		const payload: CreateSignalementPayload = {
			titre: mode.value === 'full' ? titre.value.trim() || undefined : undefined,
			description: description.value.trim() || undefined,
			statut: mode.value === 'full' ? statut.value || undefined : 'nouveau',
			latitude: toRequiredNumber(latitude.value, 'Latitude'),
			longitude: toRequiredNumber(longitude.value, 'Longitude'),
			surfaceM2: toOptionalNumber(surfaceM2.value),
			budget: mode.value === 'full' ? toOptionalNumber(budget.value) : undefined,
			utilisateurId: uid,
			entrepriseId: mode.value === 'full' ? toOptionalNumber(entrepriseId.value) : undefined,
		}

		const created = await apiFetch(
			'/signalements',
			{
				method: 'POST',
				body: JSON.stringify(payload),
			},
			token,
		)

		showToast('Signalement créé')
		emit('created', created)
	} catch (e: any) {
		error.value = e instanceof Error ? e.message : String(e)
	} finally {
		busy.value = false
	}
}

onMounted(() => {
	if (props.initialLatitude != null && latitude.value === '') latitude.value = String(props.initialLatitude)
	if (props.initialLongitude != null && longitude.value === '') longitude.value = String(props.initialLongitude)
	if (mode.value === 'map' && props.utilisateurId != null) utilisateurId.value = String(props.utilisateurId)

	const uid = getStoredUserId()
	if (uid && !utilisateurId.value) utilisateurId.value = uid
})
</script>

<style scoped>
.signalement-card {
	border-radius: 16px;
}

.mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	font-size: 12px;
}

.row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 6px 16px;
}

.hint {
	font-size: 12px;
}

.block-msg {
	display: block;
	margin-top: 12px;
}

.actions {
	margin-top: 14px;
}
</style>
