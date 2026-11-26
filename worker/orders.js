// Pedidos y pagos con Wompi.
// - POST /api/pedidos            crea el pedido (precios tomados de D1) y devuelve el link de pago.
// - GET  /api/pedidos/:ref?id=   estado del pedido; con ?id consulta la transacción a Wompi.
// - POST /api/wompi/eventos      aviso de Wompi (firma verificada con WOMPI_EVENTS_SECRET).
// Variables: WOMPI_PUBLIC_KEY (wrangler.jsonc). Secretos en Cloudflare: WOMPI_INTEGRITY_SECRET y WOMPI_EVENTS_SECRET.

export const FREE_SHIPPING_FROM = 70000
// Bogotá tiene tarifa fija; fuera de Bogotá el envío lo cobra la transportadora al recibir.
export const BOGOTA_SHIPPING = 10000
const MAX_QTY = 10

export class OrderError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}

let schemaReady
function ensureSchema(env) {
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
      reference TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'PENDING',
      items TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      shipping INTEGER NOT NULL,
      total INTEGER NOT NULL,
      buyer TEXT NOT NULL,
      transaction_id TEXT,
      payment_method TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at)'),
  ]).catch((err) => { schemaReady = null; throw err })
  return schemaReady
}

const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map((b) => b.toString(16).padStart(2, '0')).join('')

const wompiApi = (env) => (env.WOMPI_PUBLIC_KEY || '').startsWith('pub_prod_')
  ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'

function field(v, name, max, re) {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s) throw new OrderError(`Falta: ${name}`)
  if (s.length > max || (re && !re.test(s))) throw new OrderError(`${name} no es válido`)
  return s
}

function parseBuyer(b) {
  if (!b || typeof b !== 'object') throw new OrderError('Faltan tus datos')
  const docType = ['CC', 'CE', 'NIT', 'PP', 'TI'].includes(b.docType) ? b.docType : 'CC'
  return {
    name: field(b.name, 'Nombre', 120),
    email: field(b.email, 'Correo', 160, /^[^\s@]+@[^\s@]+\.[^\s@]+$/).toLowerCase(),
    phone: field(b.phone, 'Celular', 20, /^[0-9 +()-]{7,20}$/),
    docType,
    doc: field(b.doc, 'Documento', 20, /^[0-9A-Za-z.-]{4,20}$/),
    department: field(b.department, 'Departamento', 60),
    city: field(b.city, 'Ciudad', 80),
    address: field(b.address, 'Dirección', 200),
    notes: typeof b.notes === 'string' ? b.notes.trim().slice(0, 300) : '',
  }
}

async function buildItems(env, raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 30) throw new OrderError('Tu carrito está vacío')
  const ids = [...new Set(raw.map((i) => String(i?.id || '')))]
  const { results } = await env.DB.prepare(
    `SELECT id,name,price,stock,sizes,variants FROM products WHERE id IN (${ids.map(() => '?').join(',')})`
  ).bind(...ids).all()
  const byId = Object.fromEntries(results.map((p) => [p.id, p]))
  const perProduct = {}
  const items = raw.map((i) => {
    const p = byId[i?.id]
    if (!p) throw new OrderError('Un producto de tu carrito ya no existe')
    const qty = Number(i.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new OrderError('Cantidad no válida')
    const sizes = JSON.parse(p.sizes)
    if (sizes.length && !sizes.includes(i.size)) throw new OrderError(`Talla no válida para ${p.name}`)
    const colors = JSON.parse(p.variants).map((v) => v.colorName)
    if (!colors.includes(i.color)) throw new OrderError(`Color no válido para ${p.name}`)
    perProduct[p.id] = (perProduct[p.id] || 0) + qty
    if (perProduct[p.id] > p.stock) throw new OrderError(`No hay suficientes unidades de ${p.name}`, 409)
    return { id: p.id, name: p.name, price: p.price, size: i.size || '', color: i.color, qty }
  })
  return items
}

export const isBogota = (b) => b.department === 'Bogotá D.C.'
export function shippingFor(items, buyer) {
  if (items.some((i) => i.price > FREE_SHIPPING_FROM)) return { shipping: 0, onDelivery: false }
  return isBogota(buyer) ? { shipping: BOGOTA_SHIPPING, onDelivery: false } : { shipping: 0, onDelivery: true }
}

const publicOrder = (o) => ({
  reference: o.reference,
  status: o.status,
  items: JSON.parse(o.items),
  subtotal: o.subtotal,
  shipping: o.shipping,
  shippingOnDelivery: Boolean(JSON.parse(o.buyer).shippingOnDelivery),
  total: o.total,
  createdAt: o.created_at,
})

// Cambia el estado una sola vez; si queda aprobado, descuenta el inventario.
// En modo pruebas (llave pub_test_) no se toca el inventario real.
const isTest = (env) => !(env.WOMPI_PUBLIC_KEY || '').startsWith('pub_prod_')

async function settle(env, order, tx) {
  if (tx.reference !== order.reference) return order
  if (tx.amount_in_cents !== order.total * 100 || tx.currency !== 'COP') {
    console.error('Monto de Wompi no coincide', order.reference, tx.amount_in_cents)
    return order
  }
  const status = tx.status
  if (!['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(status) || order.status === status) return order
  if (order.status === 'APPROVED') return order
  const now = new Date().toISOString()
  const r = await env.DB.prepare(
    `UPDATE orders SET status=?, transaction_id=?, payment_method=?, updated_at=? WHERE reference=? AND status=?`
  ).bind(status, tx.id, tx.payment_method_type || null, now, order.reference, order.status).run()
  if (r.meta.changes && status === 'APPROVED' && !JSON.parse(order.buyer).test) {
    const qty = {}
    for (const i of JSON.parse(order.items)) qty[i.id] = (qty[i.id] || 0) + i.qty
    await env.DB.batch(Object.entries(qty).map(([id, n]) =>
      env.DB.prepare('UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?').bind(n, id)))
  }
  return { ...order, status: r.meta.changes ? status : order.status }
}

async function create(request, env, url, body, customer) {
  const missing = ['WOMPI_PUBLIC_KEY', 'WOMPI_INTEGRITY_SECRET'].filter((k) => !env[k])
  if (missing.length) throw new OrderError(`Los pagos todavía no están configurados (falta ${missing.join(', ')})`, 503)
  if (env.CUSTOMER_LIMIT) {
    const { success } = await env.CUSTOMER_LIMIT.limit({ key: 'pedido:' + (request.headers.get('CF-Connecting-IP') || '') })
    if (!success) throw new OrderError('Demasiados intentos. Espera un minuto.', 429)
  }
  const buyer = parseBuyer(body?.buyer)
  const items = await buildItems(env, body?.items)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const { shipping, onDelivery } = shippingFor(items, buyer)
  buyer.shippingOnDelivery = onDelivery
  if (isTest(env)) buyer.test = true
  buyer.customerId = customer.id
  const total = subtotal + shipping
  const reference = `C121-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO orders (reference,status,items,subtotal,shipping,total,buyer,created_at,updated_at)
     VALUES (?,'PENDING',?,?,?,?,?,?,?)`
  ).bind(reference, JSON.stringify(items), subtotal, shipping, total, JSON.stringify(buyer), now, now).run()

  const cents = total * 100
  const signature = await sha256(`${reference}${cents}COP${env.WOMPI_INTEGRITY_SECRET}`)
  const q = new URLSearchParams({
    'public-key': env.WOMPI_PUBLIC_KEY,
    currency: 'COP',
    'amount-in-cents': String(cents),
    reference,
    'signature:integrity': signature,
    'redirect-url': `${url.origin}/?pedido=${reference}`,
    'customer-data:email': buyer.email,
    'customer-data:full-name': buyer.name,
    'customer-data:phone-number': buyer.phone.replace(/\D/g, '').replace(/^57(?=\d{10}$)/, ''),
    'customer-data:phone-number-prefix': '+57',
    'customer-data:legal-id': buyer.doc.replace(/[^0-9A-Za-z]/g, ''),
    'customer-data:legal-id-type': buyer.docType,
  })
  return { reference, total, checkoutUrl: `https://checkout.wompi.co/p/?${q}` }
}

async function status(env, ref, txId) {
  let order = await env.DB.prepare('SELECT * FROM orders WHERE reference=?').bind(ref).first()
  if (!order) throw new OrderError('Pedido no encontrado', 404)
  if (order.status === 'PENDING' && txId && /^[\w-]{1,64}$/.test(txId)) {
    const res = await fetch(`${wompiApi(env)}/transactions/${txId}`)
    if (res.ok) {
      const { data } = await res.json()
      if (data) order = await settle(env, order, data)
    }
  }
  return publicOrder(order)
}

async function event(env, body) {
  if (!env.WOMPI_EVENTS_SECRET) throw new OrderError('Eventos no configurados', 503)
  const sig = body?.signature
  if (!sig?.checksum || !Array.isArray(sig.properties)) throw new OrderError('Firma no válida', 401)
  const values = sig.properties.map((p) => p.split('.').reduce((o, k) => o?.[k], body.data))
  const expected = await sha256(values.join('') + body.timestamp + env.WOMPI_EVENTS_SECRET)
  if (expected !== String(sig.checksum).toLowerCase()) throw new OrderError('Firma no válida', 401)
  const tx = body.data?.transaction
  if (body.event !== 'transaction.updated' || !tx?.reference) return { ok: true }
  const order = await env.DB.prepare('SELECT * FROM orders WHERE reference=?').bind(tx.reference).first()
  if (order) await settle(env, order, tx)
  return { ok: true }
}

export async function listOrders(env) {
  await ensureSchema(env)
  const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all()
  return results.map((o) => ({ ...publicOrder(o), buyer: JSON.parse(o.buyer), transactionId: o.transaction_id, paymentMethod: o.payment_method }))
}

export async function handleOrders(request, env, url, readJson, json, currentCustomer) {
  await ensureSchema(env)
  const { pathname } = url
  const { method } = request
  if (pathname === '/api/pedidos' && method === 'POST') {
    if (request.headers.get('Origin') !== url.origin) throw new OrderError('Origen no permitido', 403)
    const customer = await currentCustomer(request, env)
    if (!customer) throw new OrderError('Ingresa a tu cuenta para comprar', 401)
    return json(await create(request, env, url, await readJson(request), customer), 201)
  }
  const m = pathname.match(/^\/api\/pedidos\/(C121-[A-Z0-9-]{6,40})$/)
  if (m && method === 'GET') return json(await status(env, m[1], url.searchParams.get('id')))
  if (pathname === '/api/wompi/eventos' && method === 'POST') return json(await event(env, await readJson(request)))
  throw new OrderError('No encontrado', 404)
}
