import { NextRequest, NextResponse } from 'next/server'
import { pbkdf2Sync } from 'crypto'
import { createToken, COOKIE_NAME } from '@/lib/jwt'

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
  const { username, password } = await req.json()
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ success: false, message: 'Champs manquants' }, { status: 400 })
  }

  try {
    // 1. Get admin from DB via n8n
    const admin = await n8nPost<{
      found: boolean; uid: string; nom: string; username: string
      mot_de_passe_hash: string; salt: string; role: string
      actif: boolean; must_change_password: boolean
    }>('/get-admin', { username: username.trim().toLowerCase() })

    if (!admin.found || !admin.actif) {
      return NextResponse.json({ success: false, message: 'Identifiants incorrects' }, { status: 401 })
    }

    // 2. Verify PBKDF2 locally (Node.js crypto — no n8n module restrictions)
    const hash = pbkdf2Sync(password, admin.salt, 100000, 64, 'sha512').toString('hex')
    if (hash !== admin.mot_de_passe_hash) {
      return NextResponse.json({ success: false, message: 'Identifiants incorrects' }, { status: 401 })
    }

    // 3. Update last_login
    await n8nPost('/update-last-login', { admin_uid: admin.uid })

    // 4. Issue JWT
    const token = await createToken({
      admin_uid:            admin.uid,
      username:             admin.username,
      nom:                  admin.nom,
      role:                 admin.role as 'super_admin' | 'admin',
      must_change_password: admin.must_change_password,
    })

    const response = NextResponse.json({ success: true, role: admin.role, nom: admin.nom })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    })
    // Cookie rôle lisible côté client (non sensible)
    response.cookies.set('assa_role', admin.role, {
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

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(COOKIE_NAME)
  res.cookies.delete('assa_role')
  return res
}
