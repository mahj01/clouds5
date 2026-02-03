import { useEffect, useState } from 'react'
import {
  getAllUtilisateurs,
  supprimerUtilisateur,
  createUtilisateur,
  updateUtilisateur,
  lockUser,
  unlockUser,
  getRoles,
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
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '',
    nom: '',
    prenom: '',
    roleId: '',
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('tous') // 'tous', 'actif', 'bloque'

  const loadData = async () => {
    setLoading(true)
    try {
      const [users, rolesData] = await Promise.all([
        getAllUtilisateurs(),
        getRoles(),
      ])
      setUtilisateurs(users)
      setRoles(rolesData)
    } catch (e) {
      console.error('Erreur chargement:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAddModal = () => {
    setEditingUser(null)
    setFormData({ email: '', motDePasse: '', nom: '', prenom: '', roleId: '' })
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      motDePasse: '',
      nom: user.nom || '',
      prenom: user.prenom || '',
      roleId: user.role?.id || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      if (editingUser) {
        // Modification
        const payload = {
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          roleId: formData.roleId ? Number(formData.roleId) : undefined,
        }
        if (formData.motDePasse) {
          payload.motDePasse = formData.motDePasse
        }
        await updateUtilisateur(editingUser.id, payload)
      } else {
        // Création
        if (!formData.motDePasse) {
          setFormError('Le mot de passe est obligatoire')
          setSubmitting(false)
          return
        }
        await createUtilisateur({
          email: formData.email,
          motDePasse: formData.motDePasse,
          nom: formData.nom,
          prenom: formData.prenom,
          roleId: formData.roleId ? Number(formData.roleId) : undefined,
        })
      }
      closeModal()
      loadData()
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la sauvegarde')
    }
    setSubmitting(false)
  }

  const handleToggleBlocage = async (user) => {
    const isBlocked = !!user.dateBlocage
    if (!confirm(isBlocked ? 'Débloquer cet utilisateur ?' : 'Bloquer cet utilisateur ?')) return
    
    try {
      if (isBlocked) {
        await unlockUser(user.id)
      } else {
        await lockUser(user.id)
      }
      loadData()
    } catch (err) {
      alert(err.message || 'Erreur lors du changement de statut')
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Supprimer l'utilisateur "${user.email}" ?`)) return
    try {
      await supprimerUtilisateur(user.id)
      loadData()
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression')
    }
  }

  const getStatusBadge = (user) => {
    if (user.dateBlocage) {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-600">
          Bloqué
        </span>
      )
    }
    return (
      <span className="rounded-full px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-600">
        Actif
      </span>
    )
  }

  // Filtrer les utilisateurs par statut
  const filteredUtilisateurs = utilisateurs.filter((u) => {
    if (filterStatus === 'tous') return true
    if (filterStatus === 'actif') return !u.dateBlocage
    if (filterStatus === 'bloque') return !!u.dateBlocage
    return true
  })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          <i className="fa fa-users mr-2 text-indigo-500" />
          Gestion des Utilisateurs
        </h2>

        <div className="flex items-center gap-3">
          {/* Filtre par statut */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Statut:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="tous">Tous</option>
              <option value="actif">Actif</option>
              <option value="bloque">Bloqué</option>
            </select>
          </div>

          {roleName === 'manager' && (
            <button
              onClick={openAddModal}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 shadow-sm"
            >
              + Ajouter
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-slate-500">Chargement...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div className="mb-3 text-sm text-slate-500">
            {filteredUtilisateurs.length} utilisateur(s) affiché(s) sur {utilisateurs.length}
          </div>
          <table className="w-full text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3">Email</th>
                <th className="pb-3">Nom</th>
                <th className="pb-3">Prénom</th>
                <th className="pb-3">Rôle</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Tentatives</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUtilisateurs.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.nom || '—'}</td>
                  <td className="py-3">{u.prenom || '—'}</td>
                  <td className="py-3">{u.role?.nom ?? '—'}</td>
                  <td className="py-3">{getStatusBadge(u)}</td>
                  <td className="py-3">{u.nbTentatives ?? '—'}</td>

                  <td className="py-3 text-right space-x-2">
                    {roleName === 'manager' && (
                      <>
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-blue-600 hover:underline"
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => handleToggleBlocage(u)}
                          className={u.dateBlocage ? 'text-emerald-600 hover:underline' : 'text-amber-600 hover:underline'}
                        >
                          {u.dateBlocage ? 'Débloquer' : 'Bloquer'}
                        </button>

                        <button
                          onClick={() => handleDelete(u)}
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

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                </label>
                <input
                  type="password"
                  name="motDePasse"
                  value={formData.motDePasse}
                  onChange={handleInputChange}
                  required={!editingUser}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nom}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  {submitting ? 'En cours...' : editingUser ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
