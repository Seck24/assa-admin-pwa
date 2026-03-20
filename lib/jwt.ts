// JWT HS256 — Web Crypto API (compatible Edge Runtime + Node.js 18+)

export interface AdminPayload {
  admin_uid: string
  username: string
  nom: string
  role: 'super_admin' | 'admin'
  must_change_password: boolean
  exp: number
  iat: number
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function encodeJSON(obj: object): string {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  return b64url(bytes)
}

function decodeJSON(str: string): unknown {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return JSON.parse(new TextDecoder().decode(bytes))
}

async function getKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const secret = process.env.ADMIN_JWT_SECRET || 'fallback-dev-secret-change-in-prod'
  const keyData = new TextEncoder().encode(secret)
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [usage])
}

export async function createToken(
  payload: Omit<AdminPayload, 'exp' | 'iat'>,
  expiresInSeconds = 8 * 3600,
): Promise<string> {
  const header = encodeJSON({ alg: 'HS256', typ: 'JWT' })
  const body = encodeJSON({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })
  const key = await getKey('sign')
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`))
  return `${header}.${body}.${b64url(sig)}`
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sigStr] = parts
    const key = await getKey('verify')
    const sigBytes = Uint8Array.from(
      atob(sigStr.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0),
    )
    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(`${header}.${body}`),
    )
    if (!valid) return null
    const payload = decodeJSON(body) as AdminPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export const COOKIE_NAME = 'assa_admin_token'
