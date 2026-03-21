import { NextRequest, NextResponse } from 'next/server'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { verifyToken, createToken, COOKIE_NAME } from '@/lib/jwt'

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

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ success: false }, { status: 401 })

  const { old_password, new_password } = await req.json()
  if (!old_password?.trim() || !new_password?.trim()) {
    return NextResponse.json({ success: false, message: 'Champs manquants' }, { status: 400 })
  }
  if (new_password.length < 8) {
    return NextResponse.json({ success: false, message: 'Mot de passe trop court (8 caractères min)' }, { status: 400 })
  }

  try {
    // 1. Get admin from DB to fetch current hash/salt
    const admin = await n8nPost<{
      found: boolean; mot_de_passe_hash: string; salt: string
    }>('/get-admin', { username: payload.username })

    if (!admin.found) return NextResponse.json({ success: false }, { status: 401 })

    // 2. Verify old password
    const oldHash = pbkdf2Sync(old_password, admin.salt, 100000, 64, 'sha512').toString('hex')
    if (oldHash !== admin.mot_de_passe_hash) {
      return NextResponse.json({ success: false, message: 'Ancien mot de passe incorrect' }, { status: 400 })
    }

    // 3. Hash new password
    const newSalt = randomBytes(32).toString('hex')
    const newHash = pbkdf2Sync(new_password, newSalt, 100000, 64, 'sha512').toString('hex')

    // 4. Update in DB
    await n8nPost('/update-password', {
      admin_uid:            payload.admin_uid,
      new_hash:             newHash,
      new_salt:             newSalt,
      must_change_password: false,
    })

    // 5. Re-issue JWT with must_change_password = false
    const newToken = await createToken({
      admin_uid:            payload.admin_uid,
      username:             payload.username,
      nom:                  payload.nom,
      role:                 payload.role,
      must_change_password: false,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    })
    response.cookies.set('assa_role', payload.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
