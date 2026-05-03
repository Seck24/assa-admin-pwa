'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import {
  listInternalAccounts,
  suspendClient,
  activateClient,
  deleteClient,
  type InternalAccount,
} from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  actif:    'bg-green-500/20 text-green-400',
  suspendu: 'bg-red-500/20 text-red-400',
  inactif:  'bg-gray-500/20 text-gray-400',
  essai:    'bg-yellow-500/20 text-yellow-300',
}

export default function ComptesInternesPage() {
  const [internes, setInternes] = useState<InternalAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<InternalAccount | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await listInternalAccounts(1)
      setInternes(r.internes)
      setTotal(r.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggleStatus(row: InternalAccount) {
    if (actionLoading) return
    setActionLoading(row.uid)
    setError(null)
    try {
      if (row.account_status === 'actif') {
        await suspendClient(row.uid)
      } else {
        await activateClient(row.uid, row.account_status === 'suspendu')
      }
      await load()
    } catch (e) {
      setError(`Erreur : ${e instanceof Error ? e.message : 'Réessayez'}`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete || actionLoading) return
    const uid = confirmDelete.uid
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Comptes internes</h1>
          <p className="text-xs md:text-sm text-white/50 mt-1">
            Comptes ASSA appartenant à des commerciaux (démos / entraînement). Exclus des KPI clients et commissions.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-semibold">
          {total} compte{total > 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 font-bold ml-4">✕</button>
        </div>
      )}

      {loading ? (
        <div className="bg-brand/90 rounded-2xl p-8 text-center text-white/60 text-sm">Chargement…</div>
      ) : (
        <DataTable
          data={internes}
          emptyMsg="Aucun compte interne"
          columns={[
            { key: 'code_commercial_match', label: 'Commercial', render: r => r.code_commercial_match || '—' },
            { key: 'nom_commercial', label: 'Nom', render: r => r.nom_commercial || '—' },
            { key: 'telephone', label: 'Téléphone' },
            { key: 'nom_commerce', label: 'Nom commerce', render: r => r.nom_commerce || '—' },
            {
              key: 'account_status', label: 'Statut',
              render: r => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.account_status] ?? 'bg-white/10 text-white/60'}`}>
                  {r.account_status}
                </span>
              ),
            },
            { key: 'date_activation', label: 'Activé le', render: r => r.date_activation?.slice(0, 10) ?? '—' },
            {
              key: 'actions', label: 'Actions',
              render: r => {
                const busy = actionLoading === r.uid
                const isActif = r.account_status === 'actif'
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(r)}
                      disabled={busy}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActif
                          ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      {busy ? '…' : isActif ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(r)}
                      disabled={busy}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Supprimer
                    </button>
                  </div>
                )
              },
            },
          ]}
        />
      )}

      {confirmDelete && (
        <Modal title="Supprimer ce compte interne ?" onClose={() => actionLoading ? null : setConfirmDelete(null)}>
          <div className="text-sm text-white/80 space-y-2">
            <p>Tu vas supprimer définitivement le compte ASSA de :</p>
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="font-semibold text-white">
                {confirmDelete.nom_commercial || '—'}
                {confirmDelete.code_commercial_match && (
                  <span className="text-white/50 font-normal"> ({confirmDelete.code_commercial_match})</span>
                )}
              </p>
              <p className="text-xs text-white/60 mt-1">{confirmDelete.telephone}</p>
            </div>
            <p className="text-xs text-red-300/80">
              ⚠️ Cette action supprime aussi toutes les ventes, dépenses, livraisons et inventaires associés. Le compte commercial (login app commerciale) n'est PAS supprimé.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={!!actionLoading}
              className="px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={!!actionLoading}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
