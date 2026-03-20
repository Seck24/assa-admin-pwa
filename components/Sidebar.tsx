'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin',              icon: '🏠', label: 'Accueil'      },
  { href: '/admin/commerciaux',  icon: '👥', label: 'Commerciaux'  },
  { href: '/admin/clients',      icon: '📱', label: 'Clients'      },
  { href: '/admin/activations',  icon: '⚡', label: 'Activations'  },
  { href: '/admin/commissions',  icon: '💰', label: 'Commissions'  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin-auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-56 flex flex-col bg-brand-dark border-r border-white/10 shrink-0">
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

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 p-3 pt-4">
        {NAV.map(({ href, icon, label }) => {
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
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="text-base">🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
