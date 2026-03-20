import { NextRequest, NextResponse } from 'next/server'
import { createToken, COOKIE_NAME } from '@/lib/jwt'

const N8N = 'https://automation.preo-ia.info/webhook/admin'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ success: false, message: 'Champs manquants' }, { status: 400 })
  }

  try {
    const res = await fetch(`${N8N}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      cache: 'no-store',
    })
    const data = await res.json()

    if (!data.success) {
      return NextResponse.json({ success: false, message: 'Identifiants incorrects' }, { status: 401 })
    }

    const token = await createToken({
      admin_uid:            data.admin_uid,
      username:             data.username,
      nom:                  data.nom,
      role:                 data.role,
      must_change_password: data.must_change_password,
    })

    const response = NextResponse.json({ success: true, role: data.role, nom: data.nom })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
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
  return res
}
