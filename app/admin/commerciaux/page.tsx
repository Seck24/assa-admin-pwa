'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import {
  listCommerciaux, createCommercial, toggleCommercial, resetCommercialSecret,
  type Commercial,
} from '@/lib/api'

export default function CommerciauPage() {
  const [data, setData] = useState<Commercial[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState<Commercial | null>(null)
  const [newSecret, setNewSecret] = useState('')
  const [form, setForm] = useState({ nom: '', telephone: '', code_commercial: '', code_secret: '' })
  const [msg, setMsg] = useState('')

  function load() {
    setLoading(true)
    listCommerciaux().then(setData).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await createCommercial(form)
    if (res.success) { setShowCreate(false); setForm({ nom: '', telephone: '', code_commercial: '', code_secret: '' }); load() }
    else setMsg(res.message || 'Erreur')
  }

  async function handleToggle(c: Commercial) {
    await toggleCommercial(c.uid, !c.actif)
    load()
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!showReset) return
    await resetCommercialSecret(showReset.uid, newSecret)
    setShowReset(null)
    setNewSecret('')
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Commerciaux</h1>
          <p className="text-sm text-white/40 mt-1">{data.length} commercial{data.length > 1 ? 'x' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow shadow-brand/40"
        >
          <span>+</span> Nouveau commercial
        </button>
      </div>

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30 animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={data}
          columns={[
            { key: 'code_commercial', label: 'Code' },
            { key: 'nom',             label: 'Nom'  },
            { key: 'telephone',       label: 'Téléphone' },
            {
              key: 'actif', label: 'Statut',
              render: (c) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.actif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {c.actif ? 'Actif' : 'Inactif'}
                </span>
              ),
            },
            { key: 'activations_count', label: 'Activations', render: c => String(c.activations_count ?? 0) },
            {
              key: 'actions', label: 'Actions',
              render: (c) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${c.actif ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                  >
                    {c.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => setShowReset(c)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-white/10 text-white/60 hover:bg-white/15 transition-colors"
                  >
                    🔑 Secret
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouveau commercial" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {[
              { key: 'nom',              label: 'Nom complet',      type: 'text',     ph: 'Jean Kouassi' },
              { key: 'telephone',        label: 'Téléphone',        type: 'tel',      ph: '07 00 00 00 00' },
              { key: 'code_commercial',  label: 'Code commercial',  type: 'text',     ph: 'COM001' },
              { key: 'code_secret',      label: 'Code secret',      type: 'password', ph: '••••••••' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.ph}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
                />
              </div>
            ))}
            {msg && <p className="text-red-400 text-sm">{msg}</p>}
            <button type="submit" className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors">
              Créer le commercial
            </button>
          </form>
        </Modal>
      )}

      {/* Modal reset secret */}
      {showReset && (
        <Modal title={`Nouveau secret — ${showReset.nom}`} onClose={() => setShowReset(null)}>
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Nouveau code secret</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newSecret}
                onChange={e => setNewSecret(e.target.value)}
                required
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <button type="submit" className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors">
              Réinitialiser
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
