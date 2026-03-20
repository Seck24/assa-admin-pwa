'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { listCommissions, reglerCommission, type Commission } from '@/lib/api'

function money(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
}

export default function CommissionsPage() {
  const [data, setData] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('')
  const [reglerTarget, setReglerTarget] = useState<Commission | null>(null)
  const [montantRegler, setMontantRegler] = useState('')
  const [msgRegler, setMsgRegler] = useState('')
  const [savingRegler, setSavingRegler] = useState(false)

  function load(p = periode) {
    setLoading(true)
    listCommissions(p).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const totalCommissions = data.reduce((s, c) => s + c.commission_totale, 0)
  const totalPaye = data.reduce((s, c) => s + c.montant_paye, 0)
  const totalReste = data.reduce((s, c) => s + c.reste_a_payer, 0)
  const totalActivations = data.reduce((s, c) => s + c.activations_count, 0)

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  async function handleRegler(e: React.FormEvent) {
    e.preventDefault()
    if (!reglerTarget) return
    const montant = parseFloat(montantRegler)
    if (isNaN(montant) || montant <= 0) { setMsgRegler('Montant invalide'); return }
    setSavingRegler(true)
    setMsgRegler('')
    const res = await reglerCommission(reglerTarget.commercial_uid, reglerTarget.periode || periode, montant)
    setSavingRegler(false)
    if (res.success) {
      setReglerTarget(null)
      setMontantRegler('')
      load()
    } else {
      setMsgRegler(res.message || 'Erreur')
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Par commercial</p>
        </div>
        <select
          value={periode}
          onChange={e => { setPeriode(e.target.value); load(e.target.value) }}
          className="bg-white border border-gray-300 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-gray-900 text-xs md:text-sm outline-none focus:border-brand-accent"
        >
          <option value="">Toutes les périodes</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total commissions</p>
            <p className="text-lg md:text-2xl font-bold text-emerald-600">{money(totalCommissions)}</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payé</p>
            <p className="text-lg md:text-2xl font-bold text-blue-600">{money(totalPaye)}</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reste à payer</p>
            <p className="text-lg md:text-2xl font-bold text-red-500">{money(totalReste)}</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 md:p-5">
            <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activations</p>
            <p className="text-lg md:text-2xl font-bold text-yellow-600">{totalActivations}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-gray-200 rounded-2xl p-8 text-center animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={data}
          columns={[
            { key: 'code_commercial', label: 'Code' },
            { key: 'nom_commercial',  label: 'Nom' },
            { key: 'activations_count', label: 'Activations' },
            {
              key: 'commission_totale', label: 'Commission totale',
              render: c => <span className="font-semibold text-emerald-600">{money(c.commission_totale)}</span>,
            },
            {
              key: 'montant_paye', label: 'Payé',
              render: c => <span className="font-semibold text-blue-600">{money(c.montant_paye)}</span>,
            },
            {
              key: 'reste_a_payer', label: 'Reste à payer',
              render: c => (
                <span className={`font-semibold ${c.reste_a_payer > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {money(c.reste_a_payer)}
                </span>
              ),
            },
            {
              key: 'actions', label: '',
              render: c => c.commission_totale === 0 ? null : (
                <button
                  onClick={() => { setReglerTarget(c); setMontantRegler(String(c.reste_a_payer)); setMsgRegler('') }}
                  disabled={c.reste_a_payer <= 0}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Régler
                </button>
              ),
            },
          ]}
          emptyMsg="Aucune commission calculée"
        />
      )}

      {reglerTarget && (
        <Modal title={`Régler — ${reglerTarget.nom_commercial}`} onClose={() => setReglerTarget(null)}>
          <form onSubmit={handleRegler} className="flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Commission totale</span>
                <span className="font-semibold text-emerald-400">{money(reglerTarget.commission_totale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Déjà payé</span>
                <span className="font-semibold text-blue-400">{money(reglerTarget.montant_paye)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                <span className="text-white/70 font-semibold">Reste à payer</span>
                <span className="font-bold text-red-400">{money(reglerTarget.reste_a_payer)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Montant réglé (FCFA)</label>
              <input
                type="number"
                min="1"
                max={reglerTarget.reste_a_payer}
                value={montantRegler}
                onChange={e => setMontantRegler(e.target.value)}
                required
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
              />
            </div>
            {msgRegler && <p className="text-red-400 text-sm">{msgRegler}</p>}
            <button
              type="submit"
              disabled={savingRegler}
              className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {savingRegler ? 'Enregistrement…' : 'Confirmer le paiement'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
