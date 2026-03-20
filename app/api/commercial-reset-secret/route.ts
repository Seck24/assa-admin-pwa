import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

const N8N = 'https://automation.preo-ia.info/webhook/admin'

function genSecret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json()
    if (!uid) return NextResponse.json({ success: false, message: 'UID requis' }, { status: 400 })

    const code_secret = genSecret()
    const salt = randomBytes(16).toString('hex')
    const code_secret_hash = createHash('sha256').update(salt + code_secret).digest('hex')

    const res = await fetch(`${N8N}/commercial-reset-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, code_secret_hash, salt }),
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ success: false, message: 'Erreur n8n' }, { status: 500 })

    return NextResponse.json({ success: true, code_secret })
  } catch (e) {
    console.error('commercial-reset-secret error:', e)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
