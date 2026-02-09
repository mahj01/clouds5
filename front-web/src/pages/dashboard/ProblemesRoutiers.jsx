import { useState, useCallback } from 'react'
import TypesProblemes from '../../components/problemes/TypesProblemes.jsx'
import ListeProblemes from '../../components/problemes/ListeProblemes.jsx'
import CarteProblemes from '../../components/problemes/CarteProblemes.jsx'
import StatistiquesProblemes from '../../components/problemes/StatistiquesProblemes.jsx'

export default function ProblemesRoutiers() {
  const [activeTab, setActiveTab] = useState('carte')
  const [selectedProbleme, setSelectedProbleme] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const tabs = [
    { id: 'carte', label: 'Carte', icon: 'fa-map' },
    { id: 'liste', label: 'Liste', icon: 'fa-list' },
    { id: 'types', label: 'Types', icon: 'fa-tags' },
    { id: 'stats', label: 'Statistiques', icon: 'fa-bar-chart' },
  ]

  const handleSelectProbleme = useCallback((probleme) => {
    setSelectedProbleme(probleme)
    setActiveTab('carte')
  }, [])

  const handleProblemeCreated = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <section className="mt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          <i className="fa fa-road mr-3 text-indigo-600" />
          Problèmes Routiers
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestion et suivi des problèmes routiers signalés
        </p>
      </div>

      {/* Onglets */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 rounded-t-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <i className={`fa ${tab.icon} mr-2`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-6 shadow-sm">
        {activeTab === 'carte' && (
          <CarteProblemes
            key={`carte-${refreshKey}`}
            selectedProbleme={selectedProbleme}
            onProblemeCreated={handleProblemeCreated}
          />
        )}
        {activeTab === 'liste' && (
          <ListeProblemes
            key={`liste-${refreshKey}`}
            onSelectProbleme={handleSelectProbleme}
          />
        )}
        {activeTab === 'types' && <TypesProblemes />}
        {activeTab === 'stats' && <StatistiquesProblemes key={`stats-${refreshKey}`} />}
      </div>
    </section>
  )
}
