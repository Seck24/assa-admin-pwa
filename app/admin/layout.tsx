import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const token = cookieStore.get('assa_admin_token')?.value
  const payload = token ? await verifyToken(token) : null
  const role = payload?.role ?? 'admin'
  const nom  = payload?.nom  ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      {/* Sidebar — desktop seulement */}
      <Sidebar role={role} nom={nom} />
      {/* Contenu principal — padding bas pour la nav mobile */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>
      {/* Barre de navigation — mobile seulement */}
      <MobileNav role={role} />
    </div>
  )
}
