'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) { setError('Mot de passe incorrect.'); return }
      router.push('/admin')
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/40">
            <span className="text-3xl font-black text-white">A</span>
          </div>
          <h1 className="text-xl font-bold text-white">ASSA Admin</h1>
          <p className="text-xs text-brand-accent/70">Espace administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Mot de passe admin
            </label>
            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-base outline-none focus:border-brand-accent transition-colors"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-brand/40"
          >
            {loading ? 'Connexion…' : 'Accéder au tableau de bord'}
          </button>
        </form>

        <p className="text-center text-xs text-white/20">Préo IA — ASSA Admin v1</p>
      </div>
    </div>
  )
}
