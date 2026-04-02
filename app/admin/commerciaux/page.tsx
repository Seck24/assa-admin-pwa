'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { listCommerciaux, createCommercial, toggleCommercial, type Commercial } from '@/lib/api'

async function resetSecret(c: Commercial): Promise<{ success: boolean; code_secret?: string; message?: string }> {
  const res = await fetch('/api/commercial-reset-secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: c.uid, telephone: c.telephone, nom: c.nom, code_commercial: c.code_commercial }),
    cache: 'no-store',
  })
  return res.json()
}

const MSG_TEMPLATE = (nom: string, code: string, mdp: string, tel: string) =>
  `Bonjour ${nom} 👋\n\nVoici votre kit complet ASSA :\n\n` +
  `🔑 Code commercial : ${code}\n` +
  `🔒 Mot de passe : ${mdp}\n` +
  `📞 Téléphone (connexion) : ${tel}\n\n` +
  `📱 Application ASSA (pour vos démos) :\nhttps://assa.preo-ia.info/\n\n` +
  `📊 Tableau de bord propriétaire :\nhttps://assa-dashboard.preo-ia.info/\n\n` +
  `📄 Vos guides sont joints à ce message.\n\n` +
  `Bonne vente ! 🚀`

async function sharePackage(nom: string, telephone: string, code: string, mdp: string) {
  const text = MSG_TEMPLATE(nom, code, mdp, telephone)

  if (!navigator.share) {
    // Fallback: WhatsApp deep link (text only)
    const phone = telephone.replace(/[\s\-().+]/g, '').replace(/^0/, '225')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    return
  }

  try {
    // Fetch both PDFs as files
    const [guide, brief] = await Promise.all([
      fetch('/docs/ASSA_Guide_Prise_En_Main.pdf').then(r => r.blob()),
      fetch('/docs/ASSA_Brief_Commercial.pdf').then(r => r.blob()),
    ])
    const files = [
      new File([guide], 'ASSA_Guide_Prise_En_Main.pdf', { type: 'application/pdf' }),
      new File([brief], 'ASSA_Brief_Commercial.pdf', { type: 'application/pdf' }),
    ]

    if (navigator.canShare && navigator.canShare({ files })) {
      await navigator.share({ text, files })
    } else {
      // Can't share files — share text only
      await navigator.share({ text })
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      // Last resort: WhatsApp link
      const phone = telephone.replace(/[\s\-().+]/g, '').replace(/^0/, '225')
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }
}

interface MdpInfo {
  nom: string
  telephone: string
  code_commercial: string
  mdp: string
}

export default function CommerciauPage() {
  const [data, setData] = useState<Commercial[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [mdpModal, setMdpModal] = useState<MdpInfo | null>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

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
      const createdNom = form.nom
      const createdTel = form.telephone
      setShowCreate(false)
      setForm({ nom: '', telephone: '' })
      load()
      setMdpModal({ nom: createdNom, telephone: createdTel, code_commercial: res.code_commercial, mdp: res.code_secret })
    } else {
      setMsg(res.message || 'Erreur lors de la création')
    }
  }

  async function handleToggle(c: Commercial) {
    await toggleCommercial(c.uid, !c.actif)
    load()
  }

  async function handleGenererMdp(c: Commercial) {
    setGeneratingFor(c.uid)
    const res = await resetSecret(c)
    setGeneratingFor(null)
    if (res.success && res.code_secret) {
      setMdpModal({ nom: c.nom, telephone: c.telephone, code_commercial: c.code_commercial, mdp: res.code_secret })
    }
  }

  async function handleShare() {
    if (!mdpModal) return
    setSharing(true)
    await sharePackage(mdpModal.nom, mdpModal.telephone, mdpModal.code_commercial, mdpModal.mdp)
    setSharing(false)
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
                    onClick={() => handleGenererMdp(c)}
                    disabled={generatingFor === c.uid}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                  >
                    {generatingFor === c.uid ? '…' : '🔑 MDP'}
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
            <p className="text-xs text-white/30">Code COMXXX, MDP et compte ASSA démo générés automatiquement.</p>
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

      {/* Modal MDP + package WhatsApp */}
      {mdpModal && (
        <Modal title="Kit commercial prêt" onClose={() => setMdpModal(null)}>
          <div className="flex flex-col gap-4">
            <div className="w-full bg-white/8 border border-white/15 rounded-xl px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Commercial</p>
                  <p className="text-white font-semibold">{mdpModal.nom}</p>
                  <p className="text-white/50 text-sm">{mdpModal.telephone}</p>
                </div>
                <span className="font-mono font-bold text-brand text-lg">{mdpModal.code_commercial}</span>
              </div>
              <div className="border-t border-white/10 pt-3 text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Mot de passe</p>
                <p className="text-white font-mono font-bold text-4xl tracking-[0.2em]">{mdpModal.mdp}</p>
              </div>
              <div className="border-t border-white/10 pt-3 flex flex-col gap-1 text-xs text-white/40">
                <p>📱 assa.preo-ia.info — Application ASSA (démos)</p>
                <p>📊 assa-dashboard.preo-ia.info — Dashboard propriétaire</p>
                <p>📄 2 guides inclus dans l&apos;envoi</p>
              </div>
            </div>

            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {sharing ? 'Préparation…' : '📦 Envoyer le package complet'}
            </button>
            <p className="text-xs text-white/30 text-center -mt-2">Identifiants + 2 guides PDF + liens via WhatsApp</p>

            <button
              onClick={() => setMdpModal(null)}
              className="w-full text-white/40 hover:text-white/60 text-sm transition-colors py-1"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
