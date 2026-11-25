// Valida el token que Cloudflare Access añade a cada petición autenticada.
// Si falta la configuración, nadie puede entrar al panel.
let cache = { domain: '', keys: [], at: 0 }

const fromB64url = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
const decodeJson = (s) => JSON.parse(new TextDecoder().decode(fromB64url(s)))

async function getKey(domain, kid) {
  const find = () => cache.domain === domain && cache.keys.find((k) => k.kid === kid)
  const stale = cache.domain !== domain || Date.now() - cache.at > 3600_000
  if (stale || (!find() && Date.now() - cache.at > 60_000)) {
    const res = await fetch(`https://${domain}/cdn-cgi/access/certs`)
    if (!res.ok) return null
    const { keys } = await res.json()
    cache = { domain, keys, at: Date.now() }
  }
  const jwk = find()
  if (!jwk) return null
  return crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  )
}

export async function getAdmin(request, env) {
  const domain = env.ACCESS_TEAM_DOMAIN
  const aud = env.ACCESS_AUD
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!domain || !aud || !token) return null
  try {
    const [h, p, s] = token.split('.')
    const header = decodeJson(h)
    if (header.alg !== 'RS256') return null
    const key = await getKey(domain, header.kid)
    if (!key) return null
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, fromB64url(s), new TextEncoder().encode(`${h}.${p}`)
    )
    if (!valid) return null
    const claims = decodeJson(p)
    const now = Date.now() / 1000
    if (claims.iss !== `https://${domain}`) return null
    if (![].concat(claims.aud).includes(aud)) return null
    if (!(claims.exp > now) || (claims.nbf && claims.nbf > now + 60)) return null
    return claims.email ? { email: claims.email } : null
  } catch {
    return null
  }
}
