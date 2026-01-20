import { useState } from 'react'
import './signalements.css'

export default function SignalementCreate({ onCreated }) {
  const [form, setForm] = useState({
    titre: '',
    description: '',
    latitude: '',
    longitude: '',
    statut: 'nouveau',
    surfaceM2: '',
    budget: '',
    utilisateurId: '',
    entrepriseId: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const body = {
        titre: form.titre,
        description: form.description,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        statut: form.statut,
        surfaceM2: form.surfaceM2 ? Number(form.surfaceM2) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        utilisateurId: Number(form.utilisateurId),
        entrepriseId: form.entrepriseId ? Number(form.entrepriseId) : undefined,
      }

      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch('http://localhost:3001/signalements', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onCreated?.(data)
      setForm({ titre: '', description: '', latitude: '', longitude: '', statut: 'nouveau', surfaceM2: '', budget: '', utilisateurId: '', entrepriseId: '' })
      alert('Signalement créé')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sig">
      <header className="sig__header">
        <h2>Créer un signalement</h2>
        <p className="sig__hint">Utilisez le formulaire ci-dessous (respectez les champs du DTO).</p>
      </header>

      <form className="sig__form" onSubmit={handleSubmit}>
        <label>
          Titre
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
        </label>
        <label>
          Description
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>
          Latitude
          <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        </label>
        <label>
          Longitude
          <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        </label>
        <label>
          Statut
          <input value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} />
        </label>
        <label>
          Surface (m²)
          <input value={form.surfaceM2} onChange={(e) => setForm({ ...form, surfaceM2: e.target.value })} />
        </label>
        <label>
          Budget
          <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </label>
        <label>
          Utilisateur ID
          <input value={form.utilisateurId} onChange={(e) => setForm({ ...form, utilisateurId: e.target.value })} />
        </label>
        <label>
          Entreprise ID (optionnel)
          <input value={form.entrepriseId} onChange={(e) => setForm({ ...form, entrepriseId: e.target.value })} />
        </label>

        <div>
          <button type="submit" className="sig__btn" disabled={loading}>{loading ? '...' : 'Créer'}</button>
        </div>
      </form>
    </div>
  )
}
