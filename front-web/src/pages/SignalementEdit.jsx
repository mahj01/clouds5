import { useEffect, useState } from 'react'
import './signalements.css'

export default function SignalementEdit({ id, onSaved }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`http://localhost:3001/signalements/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        if (!cancelled) setForm(data || {})
      } catch (e) {
        console.error(e)
        setForm({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (!id) return <p>Sélectionnez un signalement à modifier.</p>
  if (loading) return <p>Chargement…</p>
  if (!form) return <p>Impossible de charger le signalement.</p>

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`http://localhost:3001/signalements/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          titre: form.titre,
          description: form.description,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          statut: form.statut,
          surfaceM2: form.surfaceM2 ? Number(form.surfaceM2) : undefined,
          budget: form.budget ? Number(form.budget) : undefined,
          utilisateurId: Number(form.utilisateurId),
          entrepriseId: form.entrepriseId ? Number(form.entrepriseId) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onSaved?.(data)
      alert('Mis à jour')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="sig">
      <header className="sig__header">
        <h2>Modifier le signalement #{id}</h2>
      </header>

      <form className="sig__form" onSubmit={handleSubmit}>
        <label>
          Titre
          <input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
        </label>
        <label>
          Description
          <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>
          Latitude
          <input value={form.latitude ?? ''} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        </label>
        <label>
          Longitude
          <input value={form.longitude ?? ''} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        </label>
        <label>
          Statut
          <input value={form.statut || ''} onChange={(e) => setForm({ ...form, statut: e.target.value })} />
        </label>
        <label>
          Surface (m²)
          <input value={form.surfaceM2 ?? ''} onChange={(e) => setForm({ ...form, surfaceM2: e.target.value })} />
        </label>
        <label>
          Budget
          <input value={form.budget ?? ''} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </label>
        <label>
          Utilisateur ID
          <input value={form.utilisateurId ?? ''} onChange={(e) => setForm({ ...form, utilisateurId: e.target.value })} />
        </label>
        <label>
          Entreprise ID (optionnel)
          <input value={form.entrepriseId ?? ''} onChange={(e) => setForm({ ...form, entrepriseId: e.target.value })} />
        </label>

        <div>
          <button type="submit" className="sig__btn">Enregistrer</button>
        </div>
      </form>
    </div>
  )
}
