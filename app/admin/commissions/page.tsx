'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import { listCommissions, type Commission } from '@/lib/api'

function money(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
}

export default function CommissionsPage() {
  const [data, setData] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('')

  function load(p = periode) {
    setLoading(true)
    listCommissions(p).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const totalCommissions = data.reduce((s, c) => s + c.commission_totale, 0)
  const totalActivations = data.reduce((s, c) => s + c.activations_count, 0)

  // Generate month options (last 12 months)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Commissions</h1>
          <p className="text-sm text-white/40 mt-1">Par commercial</p>
        </div>
        <select
          value={periode}
          onChange={e => { setPeriode(e.target.value); load(e.target.value) }}
          className="bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent"
        >
          <option value="">Toutes les périodes</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Totaux */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Total commissions</p>
            <p className="text-2xl font-bold text-emerald-400">{money(totalCommissions)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Total activations</p>
            <p className="text-2xl font-bold text-yellow-400">{totalActivations}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30 animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={data}
          columns={[
            { key: 'code_commercial',    label: 'Code'         },
            { key: 'nom_commercial',     label: 'Nom'          },
            { key: 'activations_count',  label: 'Activations'  },
            { key: 'montant_par_activation', label: 'Montant/acti', render: c => money(c.montant_par_activation) },
            {
              key: 'commission_totale', label: 'Commission totale',
              render: c => <span className="font-bold text-emerald-400">{money(c.commission_totale)}</span>,
            },
            { key: 'periode', label: 'Période', render: c => c.periode || '—' },
          ]}
          emptyMsg="Aucune commission calculée"
        />
      )}
    </div>
  )
}
