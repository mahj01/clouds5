import { useState } from 'react'
import './entreprises.css'

export default function EntrepriseCreate({ onCreated }) {
  const [form, setForm] = useState({ name: '', contact: '', address: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('http://localhost:3001/entreprises', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onCreated?.(data)
      setForm({ nom: '', contact: '', description: '' })
      alert('Entreprise créée')
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ent">
      <header className="ent__header">
        <h2>Créer une entreprise</h2>
        <p className="ent__hint">Formulaire de création.</p>
      </header>

      <form className="ent__form" onSubmit={handleSubmit}>
        <label>
          Nom
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        </label>
        <label>
          Contact
          <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </label>
        <label>
          Description
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div>
          <button type="submit" className="ent__btn" disabled={loading}>{loading ? '...' : 'Créer'}</button>
        </div>
      </form>
    </div>
  )
}
