'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { usePendingCaptures } from '@/lib/usePendingCaptures'

const NAV = [
  { href: '/admin',              icon: '🏠', label: 'Accueil',         roles: ['super_admin', 'admin'] },
  { href: '/admin/commerciaux',  icon: '👥', label: 'Commerciaux',     roles: ['super_admin', 'admin'] },
  { href: '/admin/clients',      icon: '📱', label: 'Clients',         roles: ['super_admin', 'admin'] },
  { href: '/admin/activations',  icon: '⚡', label: 'Activations',     roles: ['super_admin', 'admin'] },
  { href: '/admin/commissions',  icon: '💰', label: 'Commissions',     roles: ['super_admin'] },
  { href: '/admin/admins',       icon: '🛡️', label: 'Administrateurs', roles: ['super_admin'] },
]

interface SidebarProps {
  role: string
  nom: string
}

export default function Sidebar({ role, nom }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const pendingCaptures = usePendingCaptures()

  async function logout() {
    await fetch('/api/admin-auth', { method: 'DELETE' })
    router.push('/login')
  }

  const visibleNav = NAV.filter(n => n.roles.includes(role))

  return (
    <aside className="hidden md:flex w-56 flex-col bg-brand-dark border-r border-white/10 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-brand-accent flex items-center justify-center shadow shadow-brand-accent/40">
          <span className="text-lg font-black text-white">A</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">ASSA</p>
          <p className="text-xs text-white/40">Admin</p>
        </div>
      </div>

      {/* Admin info */}
      {nom && (
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-xs text-white/30 truncate">{nom}</p>
          <p className="text-xs font-semibold text-brand-accent/70">
            {role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 p-3 pt-4">
        {visibleNav.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-accent/20 text-white border border-brand-accent/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base relative">
                {icon}
                {href === '/admin/clients' && pendingCaptures > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCaptures}
                  </span>
                )}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <span className="text-base">🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
