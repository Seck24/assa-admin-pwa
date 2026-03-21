'use client'

export function useRole(): 'super_admin' | 'admin' {
  if (typeof document === 'undefined') return 'admin'
  try {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('assa_role='))
    if (!match) return 'admin'
    const value = match.split('=')[1]?.trim()
    return value === 'super_admin' ? 'super_admin' : 'admin'
  } catch {
    return 'admin'
  }
}
