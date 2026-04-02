import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const N8N = 'https://automation.preo-ia.info/webhook'

// Generate a readable 8-char temp password
function genTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const { telephone, nom_commercial, code_commercial } = await req.json()
    if (!telephone || !code_commercial) {
      return NextResponse.json({ success: false, message: 'Téléphone et code commercial requis' }, { status: 400 })
    }

    const mot_de_passe = genTempPassword()
    const nom_commerce = `Démo ${nom_commercial || code_commercial}`

    const res = await fetch(`${N8N}/admin/create-demo-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone, mot_de_passe, nom_commerce, nom_commercial, code_commercial }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        return NextResponse.json({ success: false, message: data.error || 'Erreur serveur' }, { status: res.status })
      } catch {
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, telephone, mot_de_passe, nom_commerce })
  } catch (e) {
    console.error('commercial-demo-create error:', e)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
