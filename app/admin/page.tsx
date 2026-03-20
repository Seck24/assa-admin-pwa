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
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-sm text-white/40 mt-1">Vue d&apos;ensemble ASSA</p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard icon="👥" label="Commerciaux" value={fmt(stats.total_commerciaux)} color="text-brand-accent" />
          <KpiCard icon="📱" label="Clients" value={fmt(stats.total_clients)} color="text-white" />
          <KpiCard icon="⚡" label="Activations totales" value={fmt(stats.total_activations)} color="text-yellow-400" />
          <KpiCard icon="🌟" label="Activations aujourd'hui" value={fmt(stats.activations_today)} color="text-green-400" sub="Aujourd'hui" />
          <KpiCard icon="💵" label="CA total" value={money(stats.ca_total)} color="text-blue-300" />
          <KpiCard icon="💰" label="Commissions" value={money(stats.commissions_total)} color="text-emerald-400" />
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Accès rapide</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/admin/commerciaux', icon: '👥', label: 'Gérer les commerciaux' },
            { href: '/admin/clients',     icon: '📱', label: 'Gérer les clients'     },
            { href: '/admin/activations', icon: '⚡', label: 'Voir les activations'  },
            { href: '/admin/commissions', icon: '💰', label: 'Calcul commissions'    },
          ].map(({ href, icon, label }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 bg-brand/20 hover:bg-brand/30 border border-brand/30 rounded-xl px-4 py-3 transition-colors"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium text-white/80">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
