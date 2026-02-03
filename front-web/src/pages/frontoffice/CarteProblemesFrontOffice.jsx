import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CarteProblemes from '../../components/problemes/CarteProblemes.jsx'
import { getProblemesStatistiques } from '../../api/problemes.js'

export default function CarteProblemesFrontOffice() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await getProblemesStatistiques()
      setStats(data)
    } catch (e) {
      console.error('Erreur chargement stats:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-800 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                <i className="fa fa-map-marker mr-3" />
                Carte des Problèmes Routiers
              </h1>
              <p className="mt-2 text-indigo-100">
                Visualisez et signalez les problèmes de voirie à Madagascar
              </p>
            </div>
            <Link
              to="/signaler-probleme"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-gray-100 transition"
            >
              <i className="fa fa-plus mr-2" />
              Signaler un problème
            </Link>
          </div>

          {/* Stats rapides */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-indigo-100">Total signalements</div>
              </div>
              <div className="rounded-xl border border-red-300/30 bg-red-500/20 p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.parStatut?.actifs || 0}</div>
                <div className="text-xs text-indigo-100">Problèmes actifs</div>
              </div>
              <div className="rounded-xl border border-yellow-300/30 bg-yellow-500/20 p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.parStatut?.enCours || 0}</div>
                <div className="text-xs text-indigo-100">En cours</div>
              </div>
              <div className="rounded-xl border border-green-300/30 bg-green-500/20 p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.parStatut?.resolus || 0}</div>
                <div className="text-xs text-indigo-100">Résolus</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <CarteProblemes onProblemeCreated={loadStats} />
        </div>
      </div>

      {/* Légende / Info */}
      <div className="px-4 pb-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="fa fa-info-circle mr-2 text-indigo-600" />
              Comment ça marche ?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <i className="fa fa-map-marker text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">1. Localisez</h3>
                  <p className="text-sm text-gray-500">Naviguez sur la carte pour trouver l'emplacement du problème</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <i className="fa fa-plus-circle text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">2. Signalez</h3>
                  <p className="text-sm text-gray-500">Cliquez sur "Signaler" et décrivez le problème rencontré</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <i className="fa fa-check-circle text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">3. Suivez</h3>
                  <p className="text-sm text-gray-500">Consultez l'état de résolution de votre signalement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
