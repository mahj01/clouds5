import { useEffect, useState } from 'react'
import './entreprises.css'

export default function EntrepriseEdit({ id, onSaved }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`http://localhost:3001/entreprises/${id}`, {
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

  if (!id) return <p>Sélectionnez une entreprise à modifier.</p>
  if (loading) return <p>Chargement…</p>
  if (!form) return <p>Impossible de charger l'entreprise.</p>

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`http://localhost:3001/entreprises/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form),
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
    <div className="ent">
      <header className="ent__header">
        <h2>Modifier l'entreprise #{id}</h2>
      </header>

      <form className="ent__form" onSubmit={handleSubmit}>
        <label>
          Nom
          <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Contact
          <input value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </label>
        <label>
          Adresse
          <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <div>
          <button type="submit" className="ent__btn">Enregistrer</button>
        </div>
      </form>
    </div>
  )
}
