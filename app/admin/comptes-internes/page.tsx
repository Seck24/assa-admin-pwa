'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import { listInternalAccounts, type InternalAccount } from '@/lib/api'

export default function ComptesInternesPage() {
  const [internes, setInternes] = useState<InternalAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
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
            { key: 'account_status', label: 'Statut',
              render: r => (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                  interne
                </span>
              ),
            },
            { key: 'date_activation', label: 'Activé le', render: r => r.date_activation?.slice(0, 10) ?? '—' },
          ]}
        />
      )}
    </div>
  )
}
