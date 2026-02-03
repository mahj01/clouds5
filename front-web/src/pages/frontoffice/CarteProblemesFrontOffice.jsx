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
    <div className="min-h-screen bg-slate-950">
      {/* Hero section */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-slate-950 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                <i className="fa fa-map-marker text-indigo-400 mr-3" />
                Carte des Problèmes Routiers
              </h1>
              <p className="mt-2 text-slate-300">
                Visualisez et signalez les problèmes de voirie à Madagascar
              </p>
            </div>
            <Link
              to="/signaler-probleme"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
            >
              <i className="fa fa-plus mr-2" />
              Signaler un problème
            </Link>
          </div>

          {/* Stats rapides */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-400">Total signalements</div>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.parStatut?.actifs || 0}</div>
                <div className="text-xs text-slate-400">Problèmes actifs</div>
              </div>
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.parStatut?.enCours || 0}</div>
                <div className="text-xs text-slate-400">En cours</div>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.parStatut?.resolus || 0}</div>
                <div className="text-xs text-slate-400">Résolus</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="px-4 pb-8">
        <div className="mx-auto max-w-7xl">
          <CarteProblemes onProblemeCreated={loadStats} />
        </div>
      </div>

      {/* Légende / Info */}
      <div className="px-4 pb-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              <i className="fa fa-info-circle mr-2 text-indigo-400" />
              Comment ça marche ?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa fa-map-marker text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">1. Localisez</h3>
                  <p className="text-sm text-slate-400">Naviguez sur la carte pour trouver l'emplacement du problème</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa fa-plus-circle text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">2. Signalez</h3>
                  <p className="text-sm text-slate-400">Cliquez sur "Signaler" et décrivez le problème rencontré</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa fa-check-circle text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">3. Suivez</h3>
                  <p className="text-sm text-slate-400">Consultez l'état de résolution de votre signalement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
