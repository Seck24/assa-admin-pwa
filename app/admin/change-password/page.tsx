'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.new_password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.new_password.length < 8) { setError('Mot de passe trop court (8 caractères min)'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Erreur'); return }
      router.push('/admin')
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-full p-4">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-lg font-bold text-white">Changer votre mot de passe</h1>
          <p className="text-xs text-white/40 text-center">
            Vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { key: 'old_password', label: 'Mot de passe actuel',     ph: '••••••••',     ac: 'current-password' },
            { key: 'new_password', label: 'Nouveau mot de passe',     ph: 'Min. 8 carac.', ac: 'new-password'    },
            { key: 'confirm',      label: 'Confirmer le mot de passe', ph: '••••••••',    ac: 'new-password'    },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{f.label}</label>
              <input
                type="password"
                placeholder={f.ph}
                autoComplete={f.ac}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                required
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Enregistrement…' : 'Confirmer le nouveau mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
