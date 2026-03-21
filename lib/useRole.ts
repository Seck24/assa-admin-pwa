'use client'

export function useRole(): 'super_admin' | 'admin' {
  if (typeof document === 'undefined') return 'admin'
  try {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('assa_admin_token='))
    if (!cookie) return 'admin'
    const token = cookie.split('=')[1]
    const payload = token.split('.')[1]
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const json = JSON.parse(atob(padded))
    return json.role || 'admin'
  } catch {
    return 'admin'
  }
}
