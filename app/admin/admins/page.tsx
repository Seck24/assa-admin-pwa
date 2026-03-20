'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { listAdmins, createAdmin, toggleAdmin, resetAdminPassword, type AdminUser } from '@/lib/api'

export default function AdminsPage() {
  const [data, setData] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tempCredentials, setTempCredentials] = useState<{ username: string; password: string } | null>(null)
  const [form, setForm] = useState({ nom: '', username: '', role: 'admin' as 'admin' | 'super_admin' })
  const [msg, setMsg] = useState('')

  function load() {
    setLoading(true)
    listAdmins().then(setData).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await createAdmin({ ...form, created_by: '' })
    if (res.success) {
      setShowCreate(false)
      setForm({ nom: '', username: '', role: 'admin' })
      setTempCredentials({ username: res.username!, password: res.temp_password! })
      load()
    } else {
      setMsg(res.message || 'Erreur')
    }
  }

  async function handleToggle(a: AdminUser) {
    if (a.role === 'super_admin') return
    await toggleAdmin(a.uid, !a.actif)
    load()
  }

  async function handleReset(a: AdminUser) {
    if (a.role === 'super_admin') return
    const res = await resetAdminPassword(a.uid)
    if (res.success) setTempCredentials({ username: a.username, password: res.temp_password! })
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Administrateurs</h1>
          <p className="text-xs md:text-sm text-white/40 mt-1">{data.length} compte{data.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 md:gap-2 bg-brand hover:bg-brand-light text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-colors shadow shadow-brand/40 shrink-0"
        >
          + Nouvel admin
        </button>
      </div>

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30 animate-pulse">Chargement…</div>
      ) : (
        <DataTable
          data={data}
          columns={[
            { key: 'username', label: 'Identifiant' },
            { key: 'nom',      label: 'Nom' },
            {
              key: 'role', label: 'Rôle',
              render: a => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.role === 'super_admin' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-white/10 text-white/60'}`}>
                  {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              ),
            },
            {
              key: 'actif', label: 'Statut',
              render: a => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.actif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {a.actif ? 'Actif' : 'Inactif'}
                </span>
              ),
            },
            { key: 'last_login', label: 'Dernière connexion', render: a => a.last_login?.slice(0, 16).replace('T', ' ') ?? '—' },
            {
              key: 'actions', label: 'Actions',
              render: a => a.role === 'super_admin' ? <span className="text-xs text-white/20">—</span> : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(a)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${a.actif ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                  >
                    {a.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleReset(a)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                  >
                    🔑 Reset
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouvel administrateur" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {[
              { key: 'nom',      label: 'Nom complet',  type: 'text', ph: 'Jean Kouassi' },
              { key: 'username', label: 'Identifiant',  type: 'text', ph: 'jean.kouassi' },
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Rôle</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as 'admin' | 'super_admin' }))}
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            {msg && <p className="text-red-400 text-sm">{msg}</p>}
            <button type="submit" className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors">
              Créer l&apos;admin
            </button>
          </form>
        </Modal>
      )}

      {/* Modal affichage mdp provisoire — UNE SEULE FOIS */}
      {tempCredentials && (
        <Modal title="Credentials provisoires" onClose={() => setTempCredentials(null)}>
          <div className="flex flex-col gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-300">
              ⚠️ Ce mot de passe n&apos;est affiché qu&apos;une seule fois. Communiquez-le de manière sécurisée.
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Identifiant',       value: tempCredentials.username },
                { label: 'Mot de passe temp.', value: tempCredentials.password },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-1">
                  <p className="text-xs text-white/40 uppercase tracking-wider">{row.label}</p>
                  <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 font-mono text-white text-sm select-all">
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setTempCredentials(null)}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors"
            >
              J&apos;ai noté, fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
