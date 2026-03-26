'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { listClients, activateClient, suspendClient, deleteClient, type Client } from '@/lib/api'
import { useRole } from '@/lib/useRole'

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
  const [captureView, setCaptureView] = useState<Client | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [sortCapture, setSortCapture] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const role = useRole()
  const isSuperAdmin = role === 'super_admin'

  // Nombre de clients avec capture en attente (essai + has_capture)
  const pendingCaptures = clients.filter(c => c.has_capture && c.account_status !== 'actif').length

  async function load(p = page, s = search) {
    setLoading(true)
    try {
      const r = await listClients(p, s)
      setClients(r.clients)
      setTotal(r.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  async function handleActivate(uid: string, currentStatus?: string) {
    if (actionLoading) return
    setActionLoading(uid)
    setError(null)
    try {
      await activateClient(uid, currentStatus === 'suspendu')
      setCaptureView(null)
      await load()
    } catch (e) {
      setError(`Erreur activation : ${e instanceof Error ? e.message : 'Réessayez'}`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSuspend(uid: string) {
    if (actionLoading) return
    setActionLoading(uid)
    setError(null)
    try {
      await suspendClient(uid)
      await load()
    } catch (e) {
      setError(`Erreur suspension : ${e instanceof Error ? e.message : 'Réessayez'}`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(uid: string) {
    if (actionLoading) return
    if (confirmDelete !== uid) {
      setConfirmDelete(uid)
      setTimeout(() => setConfirmDelete(null), 4000)
      return
    }
    setActionLoading(uid)
    setError(null)
    try {
      await deleteClient(uid)
      setConfirmDelete(null)
      await load()
    } catch (e) {
      setError(`Erreur suppression : ${e instanceof Error ? e.message : 'Réessayez'}`)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">{total} client{total > 1 ? 's' : ''}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-gray-900 text-xs md:text-sm outline-none focus:border-brand-accent w-36 md:w-52 placeholder:text-gray-400"
          />
          <button type="submit" className="bg-brand hover:bg-brand-light text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-colors">
            Chercher
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 font-bold ml-4">✕</button>
        </div>
      )}

      {loading ? (
        <div className="bg-brand/30 rounded-2xl p-8 text-center text-gray-700 animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={sortCapture
            ? [...clients].sort((a, b) => {
                // En premier : has_capture=true + statut≠actif (à activer)
                const aPending = a.has_capture && a.account_status !== 'actif' ? 0 : 1
                const bPending = b.has_capture && b.account_status !== 'actif' ? 0 : 1
                if (aPending !== bPending) return aPending - bPending
                // Ensuite : has_capture=true + actif (déjà traité)
                const aHas = a.has_capture ? 0 : 1
                const bHas = b.has_capture ? 0 : 1
                return aHas - bHas
              })
            : clients}
          columns={[
            { key: 'telephone', label: 'Téléphone' },
            { key: 'nom', label: 'Nom commerce' },
            { key: 'ville', label: 'Ville/Commune', render: c => c.ville || '—' },
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
            ...(isSuperAdmin ? [{
              key: 'capture' as const,
              label: (
                <button
                  onClick={() => setSortCapture(s => !s)}
                  className={`flex items-center gap-1 transition-colors ${sortCapture ? 'text-brand-accent' : ''}`}
                >
                  Capture {sortCapture ? '▲' : ''}
                  {pendingCaptures > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingCaptures}
                    </span>
                  )}
                </button>
              ) as unknown as string,
              render: (c: Client) => {
                const isActivated = c.account_status === 'actif'
                const hasCapture = c.has_capture
                if (!hasCapture) return <span className="text-white/20 text-xs">—</span>
                return (
                  <button
                    onClick={() => setCaptureView(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      isActivated
                        ? 'bg-white/5 text-white/30 cursor-pointer'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer'
                    }`}
                  >
                    {isActivated ? '📷 Voir' : '📷 Voir'}
                  </button>
                )
              },
            }] : []),
            ...(isSuperAdmin ? [{
              key: 'actions' as const, label: 'Actions',
              render: (c: Client) => (
                <div className="flex gap-2">
                  {c.account_status !== 'actif' && (
                    <button
                      onClick={() => handleActivate(c.uid, c.account_status)}
                      disabled={actionLoading === c.uid}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-wait"
                    >
                      {actionLoading === c.uid ? '...' : c.account_status === 'suspendu' ? 'Réactiver' : 'Activer'}
                    </button>
                  )}
                  {c.account_status !== 'suspendu' && (
                    <button
                      onClick={() => handleSuspend(c.uid)}
                      disabled={actionLoading === c.uid}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-wait"
                    >
                      {actionLoading === c.uid ? '...' : 'Suspendre'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.uid)}
                    disabled={!!actionLoading}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-wait ${
                      confirmDelete === c.uid
                        ? 'bg-red-600 text-white'
                        : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                    }`}
                  >
                    {confirmDelete === c.uid ? 'Confirmer ?' : 'Supprimer'}
                  </button>
                </div>
              ),
            }] : []),
          ]}
        />
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors">
            ← Précédent
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => { setPage(p => p + 1); load(page + 1) }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors">
            Suivant →
          </button>
        </div>
      )}

      {/* Modal capture paiement */}
      {captureView && (
        <Modal title={`Capture — ${captureView.nom_complet || captureView.nom}`} onClose={() => setCaptureView(null)}>
          <div className="flex flex-col gap-4">
            {captureView.capture_paiement ? (
              <img
                src={captureView.capture_paiement}
                alt="Capture paiement"
                className="w-full rounded-xl border border-white/10"
              />
            ) : (
              <p className="text-white/40 text-sm text-center py-8">Aucune capture disponible</p>
            )}

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Téléphone</span>
                <span className="text-white font-medium">{captureView.telephone}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Statut</span>
                <span className={`font-semibold ${captureView.account_status === 'actif' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {captureView.account_status}
                </span>
              </div>
            </div>

            {captureView.account_status !== 'actif' && (
              <button
                onClick={() => handleActivate(captureView.uid, captureView.account_status)}
                disabled={!!actionLoading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-wait"
              >
                {actionLoading ? 'Activation en cours...' : 'Valider le paiement et activer le compte'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
