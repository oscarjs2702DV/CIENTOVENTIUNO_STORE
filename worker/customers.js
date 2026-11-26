import { sendWelcome, sendCode, mailReady } from './welcome.js'

// Cuentas de clientes: correo y contraseña, o Google.
// La sesión es un token aleatorio en la cookie __Host-cliente; en la base solo
// se guarda su huella SHA-256, así que una copia de la base no abre sesiones.
const COOKIE = '__Host-cliente'
const GOOGLE_COOKIE = '__Host-google'
const SESSION_DAYS = 30
const PBKDF2_ROUNDS = 100000 // máximo que permite Workers
const enc = new TextEncoder()
const AVATAR_TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }
const MAX_AVATAR = 400 * 1024

export class CustomerError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (s) => Uint8Array.from(s.match(/../g), (h) => parseInt(h, 16))
const randomHex = (bytes) => toHex(crypto.getRandomValues(new Uint8Array(bytes)))
const sha256 = async (s) => toHex(await crypto.subtle.digest('SHA-256', enc.encode(s)))

function sameBytes(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

// Las tablas se crean solas la primera vez, sin pasos manuales en la base.
let schemaReady
function ensureSchema(env) {
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT,
      google_sub TEXT UNIQUE,
      created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_sessions (
      token_hash TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL)`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS customer_sessions_customer ON customer_sessions(customer_id)'),
    // Registros esperando el código que se mandó al correo.
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS pending_signups (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      sent_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL)`),
  ]).then(async () => {
    // Columnas añadidas después: si ya existen, D1 avisa y se ignora.
    for (const col of ['avatar TEXT', 'birth_date TEXT']) {
      await env.DB.prepare(`ALTER TABLE customers ADD COLUMN ${col}`).run().catch((err) => {
        if (!/duplicate column/i.test(String(err?.message))) throw err
      })
    }
  }).catch((err) => { schemaReady = undefined; throw err })
  return schemaReady
}

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ROUNDS }, key, 256))
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${PBKDF2_ROUNDS}$${toHex(salt)}$${toHex(await derive(password, salt))}`
}

async function checkPassword(password, stored) {
  const [, rounds, salt, hash] = (stored || '').split('$')
  // Sin contraseña guardada igual se calcula una, para que la respuesta tarde
  // lo mismo y no delate qué correos tienen cuenta.
  if (Number(rounds) !== PBKDF2_ROUNDS || !salt || !hash) {
    await derive(password, crypto.getRandomValues(new Uint8Array(16)))
    return false
  }
  return sameBytes(await derive(password, fromHex(salt)), fromHex(hash))
}

function email(value) {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new CustomerError('Escribe un correo válido')
  return v
}

function password(value) {
  if (typeof value !== 'string' || value.length < 8) throw new CustomerError('La contraseña necesita al menos 8 caracteres')
  if (value.length > 128) throw new CustomerError('La contraseña es demasiado larga')
  return value
}

const cleanName = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 80) : '')
const publicCustomer = (c) => ({
  name: c.name,
  email: c.email,
  google: Boolean(c.google_sub),
  avatar: c.avatar || null,
  birthDate: c.birth_date || null,
})

// Fecha de nacimiento AAAA-MM-DD; con ella el sistema calcula la edad.
function birthDate(value) {
  if (value === null || value === '') return null
  const m = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  if (!d || d.getUTCDate() !== +m[3] || d.getUTCMonth() !== +m[2] - 1) throw new CustomerError('Fecha de nacimiento no válida')
  const now = new Date()
  let age = now.getUTCFullYear() - d.getUTCFullYear()
  if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) age--
  if (age < 13 || age > 110) throw new CustomerError('Revisa tu fecha de nacimiento (debes tener al menos 13 años)')
  return value
}

const avatarKey = (url) => url?.match(/^\/img\/(avatar-[0-9a-f-]+\.(webp|jpg|png))$/)?.[1]

async function startSession(env, customerId) {
  const token = randomHex(32)
  const expires = Date.now() + SESSION_DAYS * 86400_000
  await env.DB.prepare('INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?,?,?)')
    .bind(await sha256(token), customerId, expires).run()
  return `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`
}

const clearCookie = (name) => `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`

function readCookie(request, name) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return m ? m[1] : null
}

export async function currentCustomer(request, env) {
  const token = readCookie(request, COOKIE)
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null
  return env.DB.prepare(
    `SELECT c.* FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(await sha256(token), Date.now()).first()
}

const CODE_MINUTES = 10
const CODE_ATTEMPTS = 5
const RESEND_WAIT = 60_000
const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')
const codeHash = (mail, code) => sha256(`${mail}:${code}`)

// Crea o renueva el registro pendiente y manda el código al correo.
async function sendSignupCode(env, mail, fields) {
  const prev = await env.DB.prepare('SELECT sent_at FROM pending_signups WHERE email = ?').bind(mail).first()
  if (prev && Date.now() - prev.sent_at < RESEND_WAIT) throw new CustomerError('Espera un minuto para pedir otro código.', 429)
  const code = newCode()
  const now = Date.now()
  const hash = await codeHash(mail, code)
  if (fields) {
    await env.DB.prepare(
      `INSERT INTO pending_signups (email,name,password_hash,code_hash,attempts,sent_at,expires_at) VALUES (?,?,?,?,0,?,?)
       ON CONFLICT(email) DO UPDATE SET name=excluded.name, password_hash=excluded.password_hash,
       code_hash=excluded.code_hash, attempts=0, sent_at=excluded.sent_at, expires_at=excluded.expires_at`
    ).bind(mail, fields.name, fields.hash, hash, now, now + CODE_MINUTES * 60_000).run()
  } else {
    await env.DB.prepare('UPDATE pending_signups SET code_hash=?, attempts=0, sent_at=?, expires_at=? WHERE email=?')
      .bind(hash, now, now + CODE_MINUTES * 60_000, mail).run()
  }
  try { await sendCode(env, { email: mail, code }) } catch {
    throw new CustomerError('No pudimos enviar el código a tu correo. Inténtalo de nuevo en un momento.', 502)
  }
}

const googleReady = (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

async function limited(request, env) {
  if (!env.CUSTOMER_LIMIT) throw new CustomerError('El acceso de clientes todavía no está configurado', 503)
  const { success } = await env.CUSTOMER_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'desconocida' })
  if (!success) throw new CustomerError('Demasiados intentos. Espera un minuto.', 429)
}

// ---------- Google (OAuth 2.0 con PKCE) ----------
const back = (url, status, cookies = []) => {
  const headers = new Headers({ Location: url, 'Cache-Control': 'no-store' })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(null, { status: 302, headers })
}
const googleError = (origin, code) => back(`${origin}/?google=${code}#/cuenta`, 302, [clearCookie(GOOGLE_COOKIE)])

async function googleStart(request, env, url) {
  if (!googleReady(env)) return googleError(url.origin, 'no-disponible')
  await limited(request, env)
  const state = randomHex(16)
  const verifier = randomHex(32)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(
    await crypto.subtle.digest('SHA-256', enc.encode(verifier))
  ))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/cuenta/google/vuelta`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return back(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302,
    [`${GOOGLE_COOKIE}=${state}.${verifier}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`])
}

function decodeJwtPayload(jwt) {
  const part = (jwt || '').split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))))
  } catch { return null }
}

async function googleReturn(request, env, url, ctx) {
  const saved = readCookie(request, GOOGLE_COOKIE)?.match(/^([0-9a-f]{32})\.([0-9a-f]{64})$/)
  const state = url.searchParams.get('state') || ''
  const code = url.searchParams.get('code')
  if (!googleReady(env)) return googleError(url.origin, 'no-disponible')
  if (url.searchParams.get('error')) return googleError(url.origin, 'cancelado')
  if (!saved || !code || !sameBytes(enc.encode(state), enc.encode(saved[1]))) return googleError(url.origin, 'error')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/cuenta/google/vuelta`,
      grant_type: 'authorization_code',
      code_verifier: saved[2],
    }),
  })
  if (!res.ok) return googleError(url.origin, 'error')
  // El id_token llega directo de Google por HTTPS, así que basta con revisar
  // sus datos; no hace falta validar la firma.
  const t = decodeJwtPayload((await res.json()).id_token)
  if (!t || !['https://accounts.google.com', 'accounts.google.com'].includes(t.iss) ||
      t.aud !== env.GOOGLE_CLIENT_ID || !(t.exp * 1000 > Date.now()) || !t.sub) {
    return googleError(url.origin, 'error')
  }
  if (t.email_verified !== true || typeof t.email !== 'string') return googleError(url.origin, 'sin-correo')

  await ensureSchema(env)
  const mail = t.email.trim().toLowerCase()
  let isNew = false
  let customer = await env.DB.prepare('SELECT * FROM customers WHERE google_sub = ?').bind(t.sub).first()
  if (!customer) {
    customer = await env.DB.prepare('SELECT * FROM customers WHERE email = ?').bind(mail).first()
    if (customer) {
      // Google confirma que el correo es suyo. Se borra la contraseña previa
      // porque nadie comprobó ese correo: si otra persona creó la cuenta
      // usándolo, pierde el acceso. Se cierran las sesiones abiertas.
      await env.DB.batch([
        env.DB.prepare('UPDATE customers SET google_sub = ?, password_hash = NULL WHERE id = ?').bind(t.sub, customer.id),
        env.DB.prepare('DELETE FROM customer_sessions WHERE customer_id = ?').bind(customer.id),
      ])
    } else {
      customer = { id: crypto.randomUUID() }
      await env.DB.prepare('INSERT INTO customers (id,email,name,google_sub,created_at) VALUES (?,?,?,?,?)')
        .bind(customer.id, mail, cleanName(t.name), t.sub, new Date().toISOString()).run()
      isNew = true
      sendWelcome(env, ctx, { name: cleanName(t.name), email: mail, origin: url.origin })
    }
  }
  return back(`${url.origin}/?bienvenida=${isNew ? 'nuevo' : 'hola'}`, 302, [await startSession(env, customer.id), clearCookie(GOOGLE_COOKIE)])
}

// ---------- Rutas /api/cuenta/* ----------
export async function handleCustomers(request, env, url, readJson, json, ctx) {
  const path = url.pathname.slice('/api/cuenta'.length)
  const { method } = request

  if (path === '/google' && method === 'GET') return googleStart(request, env, url)
  if (path === '/google/vuelta' && method === 'GET') return googleReturn(request, env, url, ctx)

  // Evita que otra web use la sesión del cliente para hacer cambios.
  if (method !== 'GET' && request.headers.get('Origin') !== url.origin) throw new CustomerError('Origen no permitido', 403)
  await ensureSchema(env)

  const withCookie = (data, cookie) => {
    const res = json(data)
    res.headers.append('Set-Cookie', cookie)
    return res
  }

  if (path === '/sesion' && method === 'GET') {
    const c = await currentCustomer(request, env)
    return json({ user: c ? publicCustomer(c) : null, google: googleReady(env) })
  }

  if (path === '/registro' && method === 'POST') {
    await limited(request, env)
    const b = await readJson(request)
    const name = cleanName(b?.name)
    if (!name) throw new CustomerError('Escribe tu nombre')
    const mail = email(b?.email)
    const hash = await hashPassword(password(b?.password))
    if (mailReady(env)) {
      // La cuenta se crea solo cuando el cliente confirma el código que le llegó.
      const taken = await env.DB.prepare('SELECT 1 FROM customers WHERE email = ?').bind(mail).first()
      if (taken) throw new CustomerError('Ya existe una cuenta con ese correo. Ingresa o usa Google.', 409)
      await sendSignupCode(env, mail, { name, hash })
      return json({ verify: true, email: mail })
    }
    const id = crypto.randomUUID()
    const r = await env.DB.prepare(
      'INSERT INTO customers (id,email,name,password_hash,created_at) VALUES (?,?,?,?,?) ON CONFLICT(email) DO NOTHING'
    ).bind(id, mail, name, hash, new Date().toISOString()).run()
    if (!r.meta.changes) throw new CustomerError('Ya existe una cuenta con ese correo. Ingresa o usa Google.', 409)
    sendWelcome(env, ctx, { name, email: mail, origin: url.origin })
    return withCookie({ user: publicCustomer({ name, email: mail }) }, await startSession(env, id))
  }

  if (path === '/registro/reenviar' && method === 'POST') {
    await limited(request, env)
    const mail = email((await readJson(request))?.email)
    const p = await env.DB.prepare('SELECT 1 FROM pending_signups WHERE email = ?').bind(mail).first()
    if (!p) throw new CustomerError('Vuelve a llenar el registro para pedir un código.', 404)
    await sendSignupCode(env, mail)
    return json({ ok: true })
  }

  if (path === '/registro/verificar' && method === 'POST') {
    await limited(request, env)
    const b = await readJson(request)
    const mail = email(b?.email)
    const code = typeof b?.code === 'string' ? b.code.replace(/\D/g, '') : ''
    const p = await env.DB.prepare('SELECT * FROM pending_signups WHERE email = ?').bind(mail).first()
    if (!p) throw new CustomerError('Vuelve a llenar el registro para pedir un código.', 404)
    const drop = () => env.DB.prepare('DELETE FROM pending_signups WHERE email = ?').bind(mail).run()
    if (p.expires_at < Date.now()) throw new CustomerError('El código venció. Pide uno nuevo.', 410)
    if (p.attempts >= CODE_ATTEMPTS) throw new CustomerError('Demasiados intentos. Pide un código nuevo.', 429)
    if (code.length !== 6 || !sameBytes(enc.encode(await codeHash(mail, code)), enc.encode(p.code_hash))) {
      await env.DB.prepare('UPDATE pending_signups SET attempts = attempts + 1 WHERE email = ?').bind(mail).run()
      const left = CODE_ATTEMPTS - p.attempts - 1
      throw new CustomerError(left > 0 ? `Código incorrecto. Te quedan ${left} intentos.` : 'Demasiados intentos. Pide un código nuevo.', 403)
    }
    const id = crypto.randomUUID()
    const r = await env.DB.prepare(
      'INSERT INTO customers (id,email,name,password_hash,created_at) VALUES (?,?,?,?,?) ON CONFLICT(email) DO NOTHING'
    ).bind(id, mail, p.name, p.password_hash, new Date().toISOString()).run()
    await drop()
    if (!r.meta.changes) throw new CustomerError('Ya existe una cuenta con ese correo. Ingresa o usa Google.', 409)
    sendWelcome(env, ctx, { name: p.name, email: mail, origin: url.origin })
    return withCookie({ user: publicCustomer({ name: p.name, email: mail }) }, await startSession(env, id))
  }

  if (path === '/ingresar' && method === 'POST') {
    await limited(request, env)
    const b = await readJson(request)
    const mail = typeof b?.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : ''
    const pass = typeof b?.password === 'string' ? b.password.slice(0, 128) : ''
    const c = mail ? await env.DB.prepare('SELECT * FROM customers WHERE email = ?').bind(mail).first() : null
    const ok = await checkPassword(pass, c?.password_hash)
    if (!c || !ok) throw new CustomerError('Correo o contraseña incorrectos', 403)
    return withCookie({ user: publicCustomer(c) }, await startSession(env, c.id))
  }

  if (path === '/salir' && method === 'POST') {
    const token = readCookie(request, COOKIE)
    if (token && /^[0-9a-f]{64}$/.test(token)) {
      await env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').bind(await sha256(token)).run()
    }
    return withCookie({ ok: true }, clearCookie(COOKIE))
  }

  // ---------- Perfil (requiere sesión) ----------
  if (path === '/perfil' || path === '/foto') {
    const c = await currentCustomer(request, env)
    if (!c) throw new CustomerError('Tu sesión venció. Vuelve a ingresar.', 401)

    if (path === '/perfil' && method === 'PUT') {
      const b = await readJson(request)
      const name = cleanName(b?.name)
      if (!name) throw new CustomerError('Escribe tu nombre')
      const birth = birthDate(b?.birthDate ?? null)
      await env.DB.prepare('UPDATE customers SET name = ?, birth_date = ? WHERE id = ?').bind(name, birth, c.id).run()
      return json({ user: publicCustomer({ ...c, name, birth_date: birth }) })
    }

    if (path === '/foto' && method === 'POST') {
      await limited(request, env)
      const type = (request.headers.get('Content-Type') || '').split(';')[0].trim()
      if (!AVATAR_TYPES[type]) throw new CustomerError('La foto debe ser JPG, PNG o WebP')
      if (Number(request.headers.get('Content-Length') || 0) > MAX_AVATAR) throw new CustomerError('La foto es demasiado grande', 413)
      const data = await request.arrayBuffer()
      if (!data.byteLength || data.byteLength > MAX_AVATAR) throw new CustomerError('La foto es demasiado grande', 413)
      const key = `avatar-${crypto.randomUUID()}.${AVATAR_TYPES[type]}`
      await env.FOTOS.put(key, data, { metadata: { type } })
      const avatar = `/img/${key}`
      const old = avatarKey(c.avatar)
      await env.DB.prepare('UPDATE customers SET avatar = ? WHERE id = ?').bind(avatar, c.id).run()
      if (old) await env.FOTOS.delete(old)
      return json({ user: publicCustomer({ ...c, avatar }) })
    }

    if (path === '/foto' && method === 'DELETE') {
      const old = avatarKey(c.avatar)
      await env.DB.prepare('UPDATE customers SET avatar = NULL WHERE id = ?').bind(c.id).run()
      if (old) await env.FOTOS.delete(old)
      return json({ user: publicCustomer({ ...c, avatar: null }) })
    }
  }

  throw new CustomerError('No encontrado', 404)
}
