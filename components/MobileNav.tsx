'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin',             icon: '🏠', label: 'Accueil',      roles: ['super_admin', 'admin'] },
  { href: '/admin/commerciaux', icon: '👥', label: 'Commerciaux',  roles: ['super_admin', 'admin'] },
  { href: '/admin/clients',     icon: '📱', label: 'Clients',      roles: ['super_admin', 'admin'] },
  { href: '/admin/activations', icon: '⚡', label: 'Activations',  roles: ['super_admin', 'admin'] },
  { href: '/admin/commissions', icon: '💰', label: 'Commissions',  roles: ['super_admin'] },
  { href: '/admin/admins',      icon: '🛡️', label: 'Admins',       roles: ['super_admin'] },
]

export default function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const visible = NAV.filter(n => n.roles.includes(role))

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
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
