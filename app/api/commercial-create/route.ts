import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes, randomUUID } from 'crypto'

const N8N = 'https://automation.preo-ia.info/webhook/admin'
const N8N_PUBLIC = 'https://automation.preo-ia.info/webhook'

function normalizePhone(tel: string): string {
  let clean = tel.replace(/[^0-9]/g, '')
  if (clean.startsWith('225')) clean = clean.substring(3)
  if (!clean.startsWith('0')) clean = '0' + clean
  return '+225' + clean
}

// Generate next COM code from existing list
function nextComCode(existingCodes: string[]): string {
  const nums = existingCodes
    .map(c => parseInt(c.replace(/^COM/, ''), 10))
    .filter(n => !isNaN(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return 'COM' + String(max + 1).padStart(3, '0')
}

// Generate 6-char alphanumeric code (uppercase letters + digits)
function genSecret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I,O,0,1 to avoid confusion
  let result = ''
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const { nom, telephone } = await req.json()
    if (!nom || !telephone) {
      return NextResponse.json({ success: false, message: 'Nom et téléphone requis' }, { status: 400 })
    }

    // Get existing codes to generate unique code_commercial
    // n8n returns empty body when table is empty — handle gracefully
    let commerciaux: { code_commercial: string }[] = []
    try {
      const listRes = await fetch(`${N8N}/commerciaux-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      })
      const text = await listRes.text()
      if (text) commerciaux = JSON.parse(text)
    } catch { /* table vide ou erreur réseau → COM001 par défaut */ }
    const code_commercial = nextComCode(commerciaux.map(c => c.code_commercial))

    // Generate code_secret and hash it (SHA256 to match commercial app login)
    const code_secret = genSecret()
    const salt = randomBytes(16).toString('hex')
    const code_secret_hash = createHash('sha256').update(salt + code_secret).digest('hex')
    const uid = randomUUID()

    // Send pre-hashed data to n8n (no crypto in n8n)
    const createRes = await fetch(`${N8N}/commercial-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, nom, telephone, code_commercial, code_secret_hash, salt }),
      cache: 'no-store',
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      return NextResponse.json({ success: false, message: err }, { status: 500 })
    }

    // Create demo ASSA account for the commercial
    try {
      const nom_commerce = `Démo ${nom}`
      const normalizedTel = normalizePhone(telephone)
      const inscRes = await fetch(`${N8N_PUBLIC}/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: normalizedTel, mot_de_passe: code_secret, nom_commerce, code_commercial }),
        cache: 'no-store',
      })
      if (inscRes.status === 201) {
        const inscData = await inscRes.json()
        const userUid = inscData?.data?.uid || inscData?.uid
        if (userUid) {
          await fetch(`${N8N}/user-activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userUid }),
            cache: 'no-store',
          })
        }
      }
    } catch { /* demo account creation is best-effort */ }

    return NextResponse.json({ success: true, code_commercial, code_secret })
  } catch (e) {
    console.error('commercial-create error:', e)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
