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
  const [form, setForm] = useState({ nom: '', telephone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  // Credentials modal after creation or reset
  const [credentials, setCredentials] = useState<{ code_commercial: string; code_secret: string; nom: string } | null>(null)

  function load() {
    setLoading(true)
    listCommerciaux().then(setData).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    const res = await createCommercial(form)
    setSubmitting(false)
    if (res.success && res.code_commercial && res.code_secret) {
      setShowCreate(false)
      setForm({ nom: '', telephone: '' })
      setCredentials({ code_commercial: res.code_commercial, code_secret: res.code_secret, nom: form.nom })
      load()
    } else {
      setMsg(res.message || 'Erreur lors de la création')
    }
  }

  async function handleToggle(c: Commercial) {
    await toggleCommercial(c.uid, !c.actif)
    load()
  }

  async function handleReset(c: Commercial) {
    const res = await resetCommercialSecret(c.uid)
    if (res.success && res.code_secret) {
      setCredentials({ code_commercial: c.code_commercial, code_secret: res.code_secret, nom: c.nom })
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Commerciaux</h1>
          <p className="text-sm text-white/40 mt-1">{data.length} commercial{data.length > 1 ? 'x' : ''}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setMsg('') }}
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
                    onClick={() => handleReset(c)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-white/10 text-white/60 hover:bg-white/15 transition-colors"
                  >
                    🔑 Nouveau code
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Modal création — seulement nom + téléphone */}
      {showCreate && (
        <Modal title="Nouveau commercial" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Nom complet</label>
              <input
                type="text"
                placeholder="Jean Kouassi"
                value={form.nom}
                onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                required
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Téléphone</label>
              <input
                type="tel"
                placeholder="07 00 00 00 00"
                value={form.telephone}
                onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                required
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <p className="text-xs text-white/30">Le code commercial et le code secret seront générés automatiquement.</p>
            {msg && <p className="text-red-400 text-sm">{msg}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Création…' : 'Créer le commercial'}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal credentials — affiché après création ou reset */}
      {credentials && (
        <Modal title="Identifiants du commercial" onClose={() => setCredentials(null)}>
          <div className="flex flex-col gap-5">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-xs">
              ⚠️ Notez ces identifiants maintenant — le code secret ne sera plus affiché.
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Commercial</p>
              <p className="text-white font-semibold text-base">{credentials.nom}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-3">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Code commercial</p>
                <p className="text-white font-mono font-bold text-xl tracking-widest">{credentials.code_commercial}</p>
              </div>
              <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-3">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Code secret</p>
                <p className="text-white font-mono font-bold text-xl tracking-widest">{credentials.code_secret}</p>
              </div>
            </div>

            <button
              onClick={() => setCredentials(null)}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors"
            >
              J'ai noté, fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
