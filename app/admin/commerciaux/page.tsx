'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { listCommerciaux, createCommercial, toggleCommercial, createDemoAccount, type Commercial } from '@/lib/api'

export default function CommerciauPage() {
  const [data, setData] = useState<Commercial[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [createdCode, setCreatedCode] = useState<{ code: string; nom: string } | null>(null)
  const [demoTarget, setDemoTarget] = useState<Commercial | null>(null)
  const [demoPhone, setDemoPhone] = useState('')
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const [demoMsg, setDemoMsg] = useState('')
  const [demoResult, setDemoResult] = useState<{ telephone: string; mot_de_passe: string; nom_commerce: string } | null>(null)

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
    if (res.success && res.code_commercial) {
      setShowCreate(false)
      setForm({ nom: '', telephone: '' })
      setCreatedCode({ code: res.code_commercial, nom: form.nom })
      load()
    } else {
      setMsg(res.message || 'Erreur lors de la création')
    }
  }

  async function handleToggle(c: Commercial) {
    await toggleCommercial(c.uid, !c.actif)
    load()
  }

  async function handleDemoCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!demoTarget) return
    setDemoSubmitting(true)
    setDemoMsg('')
    const res = await createDemoAccount({ telephone: demoPhone, nom_commercial: demoTarget.nom, code_commercial: demoTarget.code_commercial })
    setDemoSubmitting(false)
    if (res.success && res.telephone) {
      setDemoResult({ telephone: res.telephone, mot_de_passe: res.mot_de_passe!, nom_commerce: res.nom_commerce! })
    } else {
      setDemoMsg(res.message || 'Erreur lors de la création')
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Commerciaux</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">{data.length} commercial{data.length > 1 ? 'x' : ''}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setMsg('') }}
          className="flex items-center gap-1.5 md:gap-2 bg-brand hover:bg-brand-light text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-colors shadow shadow-brand/40 shrink-0"
        >
          <span>+</span> <span className="hidden sm:inline">Nouveau</span> commercial
        </button>
      </div>

      {loading ? (
        <div className="bg-brand/30 rounded-2xl p-8 text-center text-gray-700 animate-pulse">Chargement…</div>
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
                    onClick={() => { setDemoTarget(c); setDemoPhone(c.telephone || ''); setDemoMsg(''); setDemoResult(null) }}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    title="Créer un compte démo ASSA pour ce commercial"
                  >
                    Compte démo
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
            <p className="text-xs text-white/30">Un code commercial (COMXXX) sera généré automatiquement.</p>
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

      {/* Modal démo — saisie du téléphone */}
      {demoTarget && !demoResult && (
        <Modal title={`Compte démo — ${demoTarget.nom}`} onClose={() => setDemoTarget(null)}>
          <form onSubmit={handleDemoCreate} className="flex flex-col gap-4">
            <p className="text-xs text-white/40">Créer un compte ASSA actif pour que <strong className="text-white/60">{demoTarget.nom}</strong> puisse faire des démonstrations aux clients.</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Téléphone du compte démo</label>
              <input
                type="tel"
                placeholder="07 00 00 00 00"
                value={demoPhone}
                onChange={e => setDemoPhone(e.target.value)}
                required
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <p className="text-xs text-white/30">Un mot de passe temporaire sera généré automatiquement.</p>
            {demoMsg && <p className="text-red-400 text-sm">{demoMsg}</p>}
            <button
              type="submit"
              disabled={demoSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {demoSubmitting ? 'Création…' : 'Créer le compte démo'}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal résultat — affiche les credentials démo */}
      {demoResult && (
        <Modal title="Compte démo créé ✓" onClose={() => { setDemoTarget(null); setDemoResult(null) }}>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-white/40 text-center">Transmettez ces identifiants au commercial — le mot de passe ne sera affiché qu&apos;une seule fois.</p>
            <div className="bg-white/8 border border-white/15 rounded-xl px-5 py-4 flex flex-col gap-3">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Nom du compte</p>
                <p className="text-white font-semibold">{demoResult.nom_commerce}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Téléphone</p>
                <p className="text-white font-mono font-bold text-lg">{demoResult.telephone}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Mot de passe temporaire</p>
                <p className="text-white font-mono font-bold text-2xl tracking-widest">{demoResult.mot_de_passe}</p>
              </div>
            </div>
            <p className="text-xs text-white/30 text-center">Le commercial se connecte sur assa-dashboard.preo-ia.info</p>
            <button
              onClick={() => { setDemoTarget(null); setDemoResult(null) }}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {/* Modal confirmation — affiche le code généré */}
      {createdCode && (
        <Modal title="Commercial créé" onClose={() => setCreatedCode(null)}>
          <div className="flex flex-col gap-4 items-center">
            <p className="text-white font-semibold">{createdCode.nom}</p>
            <div className="bg-white/8 border border-white/15 rounded-xl px-6 py-4 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Code commercial</p>
              <p className="text-white font-mono font-bold text-3xl tracking-widest">{createdCode.code}</p>
            </div>
            <p className="text-xs text-white/40 text-center">Ce code est attribué au commercial. Les clients l&apos;utiliseront lors de leur inscription.</p>
            <button
              onClick={() => setCreatedCode(null)}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
