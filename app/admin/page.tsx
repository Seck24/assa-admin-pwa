'use client'
import { useEffect, useState } from 'react'
import KpiCard from '@/components/KpiCard'
import { getStatsOverview, type StatsOverview } from '@/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}
function money(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
}

export default function AdminHome() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStatsOverview()
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-5xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Vue d&apos;ensemble ASSA</p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl p-4 md:p-5 h-24 md:h-28 animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-xs md:text-sm">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <KpiCard icon="👥" label="Commerciaux" value={fmt(stats.total_commerciaux)} color="text-brand-accent" />
          <KpiCard icon="📱" label="Clients" value={fmt(stats.total_clients)} color="text-gray-900" />
          <KpiCard icon="⚡" label="Activations totales" value={fmt(stats.total_activations)} color="text-yellow-500" />
          <KpiCard icon="🌟" label="Activations aujourd'hui" value={fmt(stats.activations_today)} color="text-green-600" sub="Aujourd'hui" />
          <KpiCard icon="💵" label="CA total" value={money(stats.ca_total)} color="text-blue-600" />
          <KpiCard icon="💰" label="Commissions" value={money(stats.commissions_total)} color="text-emerald-600" />
        </div>
      )}

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 md:p-5">
        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Accès rapide</p>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {[
            { href: '/admin/commerciaux', icon: '👥', label: 'Gérer les commerciaux' },
            { href: '/admin/clients',     icon: '📱', label: 'Gérer les clients'     },
            { href: '/admin/activations', icon: '⚡', label: 'Voir les activations'  },
            { href: '/admin/commissions', icon: '💰', label: 'Calcul commissions'    },
          ].map(({ href, icon, label }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2 md:gap-3 bg-brand/10 hover:bg-brand/15 border border-brand/20 rounded-xl px-3 md:px-4 py-2.5 md:py-3 transition-colors"
            >
              <span className="text-lg md:text-xl">{icon}</span>
              <span className="text-xs md:text-sm font-medium text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
