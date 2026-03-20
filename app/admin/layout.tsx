import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import Sidebar from '@/components/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const token = cookieStore.get('assa_admin_token')?.value
  const payload = token ? await verifyToken(token) : null
  const role = payload?.role ?? 'admin'
  const nom  = payload?.nom  ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <Sidebar role={role} nom={nom} />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
