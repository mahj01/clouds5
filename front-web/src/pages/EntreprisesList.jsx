import { useEffect, useState } from 'react'
import './entreprises.css'

export default function EntreprisesList({ onEdit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('http://localhost:3001/entreprises', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setItems(data || [])
      } catch (e) {
        console.error(e)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="ent">
      <header className="ent__header">
        <h2>Liste des entreprises</h2>
        <p className="ent__hint">Affiche la liste des entreprises récupérées depuis l'API.</p>
      </header>

      {loading && <p>Chargement…</p>}

      {!loading && (
        <table className="ent__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.name || it.nom || '—'}</td>
                <td>{it.contact || '—'}</td>
                <td>
                  <button type="button" onClick={() => onEdit(it.id)} className="ent__btn">Modifier</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4}>Aucune entreprise trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
