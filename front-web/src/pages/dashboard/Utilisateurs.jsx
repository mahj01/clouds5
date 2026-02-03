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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">
          <i className="fa fa-users mr-2 text-indigo-500" />
          Gestion des Utilisateurs
        </h2>

        {roleName === 'manager' && (
          <Link
            to="/utilisateurs/nouveau"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 shadow-sm"
          >
            + Ajouter
          </Link>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-slate-500">Chargement...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3">Email</th>
                <th className="pb-3">Nom</th>
                <th className="pb-3">Rôle</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {utilisateurs.map((u) => (
                <tr
                  key={u.id_utilisateur}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.nom} {u.prenom}</td>

                  {/* ✅ CORRECTION ICI */}
                  <td className="py-3">{u.role?.nom ?? '—'}</td>

                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        u.statut === 'bloque'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {u.statut}
                    </span>
                  </td>

                  <td className="py-3 text-right space-x-3">
                    <Link
                      to={`/utilisateurs/${u.id_utilisateur}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Modifier
                    </Link>

                    {roleName === 'manager' && (
                      <>
                        <button
                          onClick={() => toggleBlocage(u)}
                          className="text-amber-600 hover:underline"
                        >
                          {u.statut === 'bloque'
                            ? 'Débloquer'
                            : 'Bloquer'}
                        </button>

                        <button
                          onClick={() => handleDelete(u.id_utilisateur)}
                          className="text-red-600 hover:underline"
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
