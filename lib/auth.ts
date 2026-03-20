const COOKIE_NAME = 'assa_admin_session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8h

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  return input === pw
}

export function makeSessionToken(): string {
  return Buffer.from(Date.now().toString()).toString('base64')
}

export function isValidSession(token: string | undefined): boolean {
  if (!token) return false
  try {
    const ts = parseInt(Buffer.from(token, 'base64').toString('ascii'), 10)
    return Date.now() - ts < SESSION_DURATION
  } catch {
    return false
  }
}

export { COOKIE_NAME }
