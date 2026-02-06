import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CarteProblemes from '../../components/problemes/CarteProblemes.jsx'
import { getSignalementsStatistiques } from '../../api/client.js'

export default function CarteProblemesFrontOffice() {
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setStatsError(null)
    try {
      const data = await getSignalementsStatistiques()
      setStats(data)
    } catch (e) {
      const msg = e?.message || String(e)
      console.error('Erreur chargement stats:', msg)
      setStatsError(msg)
    }
  }

  const isLoggedIn = !!localStorage.getItem('auth_token')

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              <i className="fa fa-map-marker mr-3" />
              Carte des Signalements
            </h1>
            <p className="mt-2 text-indigo-100">
              Visualisez et signalez les problèmes de voirie à Madagascar
            </p>
          </div>
          {isLoggedIn ? (
            <Link
              to="/signaler-probleme"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-gray-100 transition"
            >
              <i className="fa fa-plus mr-2" />
              Signaler un problème
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-gray-100 transition"
            >
              <i className="fa fa-sign-in mr-2" />
              Connectez-vous pour signaler
            </Link>
          )}
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

      {/* Erreur API stats */}
      {statsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <i className="fa fa-exclamation-circle" />
          <span className="flex-1">Erreur lors du chargement des statistiques : {statsError}</span>
          <button onClick={loadStats} className="text-red-600 hover:text-red-800 font-medium text-xs">
            <i className="fa fa-refresh mr-1" />Réessayer
          </button>
        </div>
      )}

      {/* Carte */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <CarteProblemes onProblemeCreated={loadStats} />
      </div>

      {/* Légende / Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          <i className="fa fa-info-circle mr-2 text-indigo-600" />
          Comment ça marche ?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <i className="fa fa-map-marker text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">1. Localisez</h3>
              <p className="text-sm text-slate-500">Naviguez sur la carte pour trouver l'emplacement du problème</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <i className="fa fa-plus-circle text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">2. Signalez</h3>
              <p className="text-sm text-slate-500">
                {isLoggedIn 
                  ? 'Cliquez sur "Signaler" et décrivez le problème rencontré'
                  : 'Connectez-vous pour signaler un problème'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <i className="fa fa-check-circle text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">3. Suivez</h3>
              <p className="text-sm text-slate-500">Consultez l'état de résolution de votre signalement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message pour visiteurs non connectés */}
      {!isLoggedIn && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <i className="fa fa-info-circle text-3xl text-indigo-600 mb-3" />
          <h3 className="text-lg font-semibold text-indigo-900">
            Connectez-vous pour plus de fonctionnalités
          </h3>
          <p className="text-sm text-indigo-700 mt-2 mb-4">
            En créant un compte, vous pourrez signaler des problèmes et suivre leur résolution.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Se connecter
            </Link>
            <Link
              to="/inscription"
              className="rounded-xl border border-indigo-300 bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
