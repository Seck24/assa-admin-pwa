'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import { listClients, suspendClient, type Client } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  actif:   'bg-green-500/20 text-green-400',
  inactif: 'bg-gray-500/20 text-gray-400',
  suspendu:'bg-red-500/20 text-red-400',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  function load(p = page, s = search) {
    setLoading(true)
    listClients(p, s)
      .then(r => { setClients(r.clients); setTotal(r.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  async function handleSuspend(uid: string) {
    await suspendClient(uid)
    load()
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">{total} client{total > 1 ? 's' : ''}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-gray-900 text-xs md:text-sm outline-none focus:border-brand-accent w-36 md:w-52"
          />
          <button type="submit" className="bg-brand hover:bg-brand-light text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-colors">
            Chercher
          </button>
        </form>
      </div>

      {loading ? (
        <div className="bg-gray-200 rounded-2xl p-8 text-center animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={clients}
          columns={[
            { key: 'telephone',   label: 'Téléphone' },
            { key: 'nom',         label: 'Nom commerce' },
            { key: 'nom_complet', label: 'Nom complet', render: c => c.nom_complet || '—' },
            {
              key: 'account_status', label: 'Statut',
              render: c => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.account_status] ?? 'bg-white/10 text-white/60'}`}>
                  {c.account_status}
                </span>
              ),
            },
            { key: 'date_inscription', label: 'Inscription', render: c => c.date_inscription?.slice(0, 10) ?? '—' },
            {
              key: 'actions', label: 'Actions',
              render: c => c.account_status === 'suspendu' ? (
                <span className="text-xs text-gray-400">—</span>
              ) : (
                <button onClick={() => handleSuspend(c.uid)} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                  Suspendre
                </button>
              ),
            },
          ]}
        />
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex gap-2 justify-center">
          <button
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); load(page - 1) }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            ← Précédent
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => { setPage(p => p + 1); load(page + 1) }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
