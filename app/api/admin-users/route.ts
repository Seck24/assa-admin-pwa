import { NextRequest, NextResponse } from 'next/server'
import { pbkdf2Sync, randomBytes, randomUUID } from 'crypto'
import { verifyToken, COOKIE_NAME } from '@/lib/jwt'

const N8N = 'https://automation.preo-ia.info/webhook/admin'

async function n8nPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${N8N}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  return res.json() as Promise<T>
}

function genTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export async function POST(req: NextRequest) {
  // Verify super_admin role
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload || payload.role !== 'super_admin') {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (action === 'create') {
    const { nom, username, role } = body
    if (!nom?.trim() || !username?.trim()) {
      return NextResponse.json({ success: false, message: 'Champs manquants' }, { status: 400 })
    }
    const uid     = randomUUID()
    const tempPwd = genTempPassword()
    const salt    = randomBytes(32).toString('hex')
    const hash    = pbkdf2Sync(tempPwd, salt, 100000, 64, 'sha512').toString('hex')

    const res = await n8nPost<{ success: boolean; message?: string }>('/admin-insert', {
      uid, nom: nom.trim(), username: username.trim().toLowerCase(),
      hash, salt, role: role || 'admin', created_by: payload.admin_uid,
    })

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message || 'Erreur' }, { status: 409 })
    }
    return NextResponse.json({ success: true, uid, username: username.trim().toLowerCase(), temp_password: tempPwd })
  }

  // ── RESET PASSWORD ────────────────────────────────────────────────────────
  if (action === 'reset_password') {
    const { uid } = body
    if (!uid) return NextResponse.json({ success: false }, { status: 400 })

    const tempPwd = genTempPassword()
    const salt    = randomBytes(32).toString('hex')
    const hash    = pbkdf2Sync(tempPwd, salt, 100000, 64, 'sha512').toString('hex')

    await n8nPost('/update-password', { admin_uid: uid, new_hash: hash, new_salt: salt, must_change_password: true })
    return NextResponse.json({ success: true, temp_password: tempPwd })
  }

  return NextResponse.json({ success: false, message: 'Action inconnue' }, { status: 400 })
}
