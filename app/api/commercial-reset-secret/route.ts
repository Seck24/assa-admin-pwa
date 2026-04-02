import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

const N8N_ADMIN = 'https://automation.preo-ia.info/webhook/admin'
const N8N = 'https://automation.preo-ia.info/webhook'

function genSecret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

async function createOrUpdateDemoAccount(telephone: string, code_secret: string, nom_commerce: string, code_commercial: string) {
  // Try to create via inscription
  const inscRes = await fetch(`${N8N}/inscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telephone, mot_de_passe: code_secret, nom_commerce, code_commercial }),
    cache: 'no-store',
  })

  if (inscRes.status === 201) {
    // New account — activate it
    const inscData = await inscRes.json()
    const uid = inscData?.data?.uid || inscData?.uid
    if (uid) {
      await fetch(`${N8N_ADMIN}/user-activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
        cache: 'no-store',
      })
    }
  } else if (inscRes.status === 409) {
    // Account already exists — update password
    await fetch(`${N8N}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone, mot_de_passe: code_secret }),
      cache: 'no-store',
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, telephone, nom, code_commercial } = await req.json()
    if (!uid) return NextResponse.json({ success: false, message: 'UID requis' }, { status: 400 })

    const code_secret = genSecret()
    const salt = randomBytes(16).toString('hex')
    const code_secret_hash = createHash('sha256').update(salt + code_secret).digest('hex')

    // 1. Reset commercial secret hash
    const res = await fetch(`${N8N_ADMIN}/commercial-reset-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, code_secret_hash, salt }),
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json({ success: false, message: 'Erreur n8n' }, { status: 500 })

    // 2. Create or update demo ASSA account (if telephone provided)
    if (telephone) {
      const nom_commerce = `Démo ${nom || code_commercial}`
      await createOrUpdateDemoAccount(telephone, code_secret, nom_commerce, code_commercial || '')
    }

    return NextResponse.json({ success: true, code_secret })
  } catch (e) {
    console.error('commercial-reset-secret error:', e)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
