import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DASHBOARD_NAV_ITEMS } from '../../constants/dashboardNav.js'
import { getDashboardSummary } from '../../api/client.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

function getStoredRoleName() {
  try {
    return localStorage.getItem('auth_role')
  } catch {
    return null
  }
}

function formatNumber(n) {
  return new Intl.NumberFormat('fr-FR').format(n || 0)
}

function formatMoney(n) {
  if (!n && n !== 0) return '0 MGA'
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(n)
  } catch {
    return `${formatNumber(n)} MGA`
  }
}

function StatCard({ icon, label, value, color = 'indigo', subtext }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colors[color]}`}>
          <i className={`${icon} text-xl`} aria-hidden="true" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
          {subtext && <div className="text-xs text-slate-400 mt-0.5">{subtext}</div>}
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, label, color = '#6366f1' }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const roleName = String(getStoredRoleName() || '').toLowerCase()
  const navItems = (Array.isArray(DASHBOARD_NAV_ITEMS) ? DASHBOARD_NAV_ITEMS : [])
    .filter((i) => i.id !== 'dashboard')
    .filter((i) => {
      if (roleName === 'manager') return true
      return !i?.adminOnly
    })

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getDashboardSummary()
      .then((data) => {
        setSummary(data)
        setError(null)
      })
      .catch((e) => setError(e?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const totaux = summary?.totaux || {}
  const sigStats = summary?.signalements || {}
  const parStatut = sigStats.parStatut || {}
  const recentSignalements = summary?.recentSignalements || []
  const recentActivites = summary?.recentActivites || []

  function statutColor(s) {
    const st = String(s || '').toLowerCase()
    if (st === 'actif' || st === 'nouveau') return '#ef4444'
    if (st === 'en_cours') return '#f59e0b'
    if (st === 'resolu' || st === 'terminé') return '#22c55e'
    if (st === 'rejete') return '#94a3b8'
    return '#6366f1'
  }

  function statutLabel(s) {
    const st = String(s || '').toLowerCase()
    if (st === 'actif' || st === 'nouveau') return 'Actif'
    if (st === 'en_cours') return 'En cours'
    if (st === 'resolu' || st === 'terminé') return 'Résolu'
    if (st === 'rejete') return 'Rejeté'
    return s || '—'
  }

  // === Données pour les graphiques Chart.js ===
  const doughnutData = useMemo(() => ({
    labels: ['Actif', 'En cours', 'Résolu', 'Rejeté'],
    datasets: [{
      data: [parStatut.actif || 0, parStatut.en_cours || 0, parStatut.resolu || 0, parStatut.rejete || 0],
      backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#94a3b8'],
      borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
      borderWidth: 2,
    }],
  }), [parStatut])

  const barData = useMemo(() => ({
    labels: ['Actif', 'En cours', 'Résolu', 'Rejeté'],
    datasets: [{
      label: 'Nombre',
      data: [parStatut.actif || 0, parStatut.en_cours || 0, parStatut.resolu || 0, parStatut.rejete || 0],
      backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#94a3b8'],
      borderRadius: 6,
    }],
  }), [parStatut])

  // Line chart - basé sur les signalements récents, groupés par jour
  const lineData = useMemo(() => {
    const days = {}
    const now = new Date()
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      days[key] = 0
    }
    // Compter les signalements récents par jour
    recentSignalements.forEach((s) => {
      if (s.dateSignalement) {
        const d = new Date(s.dateSignalement)
        const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
        if (key in days) days[key]++
      }
    })
    return {
      labels: Object.keys(days),
      datasets: [{
        label: 'Signalements',
        data: Object.values(days),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    }
  }, [recentSignalements])

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bienvenue dans votre espace. {roleName === 'manager' ? 'Vous avez un accès complet.' : 'Votre session est active.'}
        </p>
      </header>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center justify-center py-12">
          <i className="fa fa-spinner fa-spin text-2xl text-indigo-500" />
          <span className="ml-3 text-slate-500">Chargement des données…</span>
        </div>
      ) : (
        <>
          {/* Cartes principales */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="fa fa-exclamation-triangle" label="Signalements" value={formatNumber(totaux.signalements)} color="indigo" />
            <StatCard icon="fa fa-users" label="Utilisateurs" value={formatNumber(totaux.utilisateurs)} color="emerald" />
            <StatCard icon="fa fa-building" label="Entreprises" value={formatNumber(totaux.entreprises)} color="amber" />
            <StatCard icon="fa fa-check-circle" label="Avancement global" value={`${sigStats.avancementGlobal || 0}%`} color="slate" />
          </section>

          {/* Statistiques détaillées */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Par statut */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                <i className="fa fa-pie-chart mr-2 text-indigo-500" /> Signalements par statut
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <div className="text-2xl font-bold text-red-600">{parStatut.actif || 0}</div>
                  <div className="text-xs text-red-500">Actifs</div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <div className="text-2xl font-bold text-amber-600">{parStatut.en_cours || 0}</div>
                  <div className="text-xs text-amber-500">En cours</div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <div className="text-2xl font-bold text-emerald-600">{parStatut.resolu || 0}</div>
                  <div className="text-xs text-emerald-500">Résolus</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <div className="text-2xl font-bold text-slate-600">{parStatut.rejete || 0}</div>
                  <div className="text-xs text-slate-500">Rejetés</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Surface totale</div>
                  <div className="font-semibold text-slate-800">{formatNumber(sigStats.surfaceTotal)} m²</div>
                </div>
                <div>
                  <div className="text-slate-500">Budget total</div>
                  <div className="font-semibold text-slate-800">{formatMoney(sigStats.budgetTotal)}</div>
                </div>
              </div>
            </div>

            {/* Signalements récents */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                <i className="fa fa-clock-o mr-2 text-indigo-500" /> Signalements récents
              </h3>
              {recentSignalements.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun signalement récent</p>
              ) : (
                <ul className="space-y-3">
                  {recentSignalements.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: statutColor(s.statut) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">{s.titre || '—'}</div>
                        <div className="text-xs text-slate-400">
                          {s.creePar || 'Anonyme'} • {s.dateSignalement ? new Date(s.dateSignalement).toLocaleDateString('fr-FR') : '—'}
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: statutColor(s.statut) + '20', color: statutColor(s.statut) }}>
                        {statutLabel(s.statut)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/signalements" className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                Voir tous les signalements <i className="fa fa-arrow-right ml-2" />
              </Link>
            </div>
          </section>

          {/* === GRAPHIQUES === */}
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Graphique 1: Doughnut - Répartition par statut */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                <i className="fa fa-pie-chart mr-2 text-indigo-500" /> Répartition par statut
              </h3>
              <div className="h-56 flex items-center justify-center">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
                    },
                    cutout: '60%',
                  }}
                />
              </div>
            </div>

            {/* Graphique 2: Bar - Signalements par statut */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                <i className="fa fa-bar-chart mr-2 text-indigo-500" /> Comparaison des statuts
              </h3>
              <div className="h-56">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            {/* Graphique 3: Line - Tendance (données simulées basées sur les signalements récents) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                <i className="fa fa-line-chart mr-2 text-indigo-500" /> Évolution récente
              </h3>
              <div className="h-56">
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      x: { grid: { display: false } },
                    },
                    elements: {
                      line: { tension: 0.4 },
                      point: { radius: 4 },
                    },
                  }}
                />
              </div>
            </div>
          </section>

          {/* Activités récentes (manager only) */}
          {roleName === 'manager' && recentActivites.length > 0 && (
            <section className="mt-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                  <i className="fa fa-history mr-2 text-indigo-500" /> Activités récentes
                </h3>
                <ul className="space-y-2">
                  {recentActivites.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className={`h-2 w-2 rounded-full ${a.niveau === 'error' ? 'bg-red-500' : a.niveau === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="text-slate-600 flex-1">
                        <span className="font-medium">{a.utilisateur || 'Système'}</span> — {a.action} sur {a.ressource}
                      </span>
                      <span className="text-xs text-slate-400">
                        {a.dateAction ? new Date(a.dateAction).toLocaleString('fr-FR') : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/journal" className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                  Voir le journal complet <i className="fa fa-arrow-right ml-2" />
                </Link>
              </div>
            </section>
          )}

          {/* Liens rapides */}
          <section className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              <i className="fa fa-link mr-2 text-indigo-500" /> Accès rapides
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {navItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
                >
                  <i className={`${item.icon} text-lg text-indigo-500`} aria-hidden="true" />
                  <span className="flex-1 px-3">{item.label}</span>
                  <i className="fa fa-angle-right text-base text-slate-400" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}