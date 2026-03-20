'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import { listActivations, listCommerciaux, type Activation, type Commercial } from '@/lib/api'

export default function ActivationsPage() {
  const [activations, setActivations] = useState<Activation[]>([])
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  function load(p = page, f = filter) {
    setLoading(true)
    listActivations(p, f)
      .then(r => { setActivations(r.activations); setTotal(r.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    listCommerciaux().then(setCommerciaux)
    load()
  }, []) // eslint-disable-line

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Activations</h1>
          <p className="text-sm text-white/40 mt-1">{total} activation{total > 1 ? 's' : ''}</p>
        </div>
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); load(1, e.target.value) }}
          className="bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent"
        >
          <option value="">Tous les commerciaux</option>
          {commerciaux.map(c => (
            <option key={c.uid} value={c.uid}>{c.nom} ({c.code_commercial})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30 animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={activations}
          columns={[
            { key: 'date_activation',    label: 'Date',       render: a => a.date_activation?.slice(0, 16).replace('T', ' ') ?? '—' },
            { key: 'telephone_client',   label: 'Client'      },
            { key: 'nom_client',         label: 'Nom client', render: a => a.nom_client ?? '—' },
            { key: 'code_commercial',    label: 'Commercial'  },
            { key: 'montant_installation', label: 'Montant',  render: a => `${a.montant_installation?.toLocaleString('fr-FR') ?? 0} FCFA` },
            {
              key: 'statut', label: 'Statut',
              render: a => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.statut === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {a.statut}
                </span>
              ),
            },
          ]}
          emptyMsg="Aucune activation trouvée"
        />
      )}

      {total > 20 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1) }} className="px-4 py-2 bg-white/8 border border-white/15 rounded-xl text-sm text-white/60 disabled:opacity-30 hover:bg-white/15 transition-colors">
            ← Précédent
          </button>
          <span className="px-4 py-2 text-sm text-white/40">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => { setPage(p => p + 1); load(page + 1) }} className="px-4 py-2 bg-white/8 border border-white/15 rounded-xl text-sm text-white/60 disabled:opacity-30 hover:bg-white/15 transition-colors">
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
