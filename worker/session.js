// Sesión del administrador: una clave privada (secreto ADMIN_KEY) y una cookie
// firmada con ella. Cambiar la clave cierra todas las sesiones.
// Sin ADMIN_KEY, o con una clave corta, nadie puede entrar.
const COOKIE = '__Host-admin'
const HOURS = 12
const MIN_KEY = 24
const enc = new TextEncoder()

const hmacKey = (secret) =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (s) => Uint8Array.from(s.match(/../g), (h) => parseInt(h, 16))

export const isConfigured = (env) => typeof env.ADMIN_KEY === 'string' && env.ADMIN_KEY.length >= MIN_KEY

// subtle.verify compara en tiempo constante.
export async function checkKey(candidate, env) {
  if (!isConfigured(env) || typeof candidate !== 'string' || !candidate || candidate.length > 256) return false
  const proof = await crypto.subtle.sign('HMAC', await hmacKey(env.ADMIN_KEY), enc.encode('login'))
  return crypto.subtle.verify('HMAC', await hmacKey(candidate), proof, enc.encode('login'))
}

export async function sessionCookie(env) {
  const exp = String(Date.now() + HOURS * 3600_000)
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env.ADMIN_KEY), enc.encode(`session:${exp}`))
  return `${COOKIE}=${exp}.${toHex(sig)}; Path=/; Max-Age=${HOURS * 3600}; HttpOnly; Secure; SameSite=Strict`
}

export const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`

export async function isAdmin(request, env) {
  if (!isConfigured(env)) return false
  const match = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)__Host-admin=(\d{13})\.([0-9a-f]{64})(?:;|$)/)
  if (!match || Number(match[1]) <= Date.now()) return false
  return crypto.subtle.verify(
    'HMAC', await hmacKey(env.ADMIN_KEY), fromHex(match[2]), enc.encode(`session:${match[1]}`)
  )
}
