'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePendingCaptures } from '@/lib/usePendingCaptures'

const NAV = [
  { href: '/admin',             icon: '🏠', label: 'Accueil',      roles: ['super_admin', 'admin'] },
  { href: '/admin/commerciaux', icon: '👥', label: 'Commerciaux',  roles: ['super_admin', 'admin'] },
  { href: '/admin/clients',     icon: '📱', label: 'Clients',      roles: ['super_admin', 'admin'] },
  { href: '/admin/activations', icon: '⚡', label: 'Activations',  roles: ['super_admin', 'admin'] },
  { href: '/admin/commissions', icon: '💰', label: 'Commissions',  roles: ['super_admin'] },
  { href: '/admin/comptes-internes', icon: '🔧', label: 'Internes', roles: ['super_admin'] },
  { href: '/admin/admins',      icon: '🛡️', label: 'Admins',       roles: ['super_admin'] },
]

export default function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const visible = NAV.filter(n => n.roles.includes(role))
  const pendingCaptures = usePendingCaptures()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-dark/95 backdrop-blur border-t border-white/10">
      <div className="flex items-stretch justify-around">
        {visible.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-3 flex-1 text-center transition-colors ${
                active ? 'text-brand-accent' : 'text-white/40'
              }`}
            >
              <span className="text-xl leading-none relative">
                {icon}
                {href === '/admin/clients' && pendingCaptures > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCaptures}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
