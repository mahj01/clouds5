import { useEffect, useState } from 'react'
import './signalements.css'

export default function SignalementsList({ onEdit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('http://localhost:3001/signalements', {
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
    <div className="sig">
      <header className="sig__header">
        <h2>Liste des signalements</h2>
        <p className="sig__hint">Liste récupérée depuis l'API.</p>
      </header>

      {loading && <p>Chargement…</p>}

      {!loading && (
        <table className="sig__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Statut</th>
              <th>Utilisateur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.titre || it.title || '—'}</td>
                <td>{it.statut || '—'}</td>
                <td>{it.utilisateurId ?? '—'}</td>
                <td>
                  <button type="button" onClick={() => onEdit(it.id)} className="sig__btn">Modifier</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5}>Aucun signalement trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
