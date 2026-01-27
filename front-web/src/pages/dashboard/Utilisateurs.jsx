import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllUtilisateurs,
  supprimerUtilisateur,
  createHistoriqueStatusUtilisateur,
  getStatutsCompte,
} from '../../api/client.js'

function getStoredRoleName() {
  try {
    return localStorage.getItem('auth_role')
  } catch {
    return null
  }
}

export default function Utilisateurs() {
  const roleName = String(getStoredRoleName() || '').toLowerCase()

  const [utilisateurs, setUtilisateurs] = useState([])
  const [statuts, setStatuts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const users = await getAllUtilisateurs()
    const statutsCompte = await getStatutsCompte()
    setUtilisateurs(users)
    setStatuts(statutsCompte)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatutId = (nom) =>
    statuts.find((s) => s.statut === nom)?.id_statut_compte

  const toggleBlocage = async (user) => {
    const nouveauStatut =
      user.statut === 'bloque' ? 'actif' : 'bloque'

    await createHistoriqueStatusUtilisateur({
      id_utilisateur: user.id_utilisateur,
      id_statut_compte: getStatutId(nouveauStatut),
    })

    loadData()
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await supprimerUtilisateur(id)
    loadData()
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          <i className="fa fa-users mr-2" />
          Gestion des Utilisateurs
        </h2>

        {roleName === 'manager' && (
          <Link
            to="/utilisateurs/nouveau"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Ajouter
          </Link>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-slate-300">Chargement...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th>Email</th>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {utilisateurs.map((u) => (
                <tr
                  key={u.id_utilisateur}
                  className="border-b border-white/5"
                >
                  <td>{u.email}</td>
                  <td>{u.nom} {u.prenom}</td>

                  {/* ✅ CORRECTION ICI */}
                  <td>{u.role?.nom ?? '—'}</td>

                  <td>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        u.statut === 'bloque'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {u.statut}
                    </span>
                  </td>

                  <td className="text-right space-x-3">
                    <Link
                      to={`/utilisateurs/${u.id_utilisateur}/edit`}
                      className="text-blue-400 hover:underline"
                    >
                      Modifier
                    </Link>

                    {roleName === 'manager' && (
                      <>
                        <button
                          onClick={() => toggleBlocage(u)}
                          className="text-yellow-400 hover:underline"
                        >
                          {u.statut === 'bloque'
                            ? 'Débloquer'
                            : 'Bloquer'}
                        </button>

                        <button
                          onClick={() => handleDelete(u.id_utilisateur)}
                          className="text-red-400 hover:underline"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
