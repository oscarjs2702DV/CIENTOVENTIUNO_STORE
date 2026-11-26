import { CustomerError, handleCustomers } from './customers.js'
import { OrderError, handleOrders, listOrders } from './orders.js'
import { checkKey, clearCookie, isAdmin, isConfigured, sessionCookie } from './session.js'

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const fail = (message, status) => json({ error: message }, status)

const IMAGE_TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }
const MAX_IMAGE = 3 * 1024 * 1024
const MAX_BODY = 200 * 1024
const IMAGE_URL = /^\/(img|catalogo)\/[A-Za-z0-9._-]+$/

class BadInput extends Error {}

const toProduct = (row) => {
  const variants = JSON.parse(row.variants)
  const images = variants.flatMap((v) => v.images)
  return {
    ...row,
    variants,
    images,
    image: images[0] || '',
    sizes: JSON.parse(row.sizes),
    reviews: JSON.parse(row.reviews),
  }
}

function text(value, field, max, required = false) {
  const v = typeof value === 'string' ? value.trim() : ''
  if (required && !v) throw new BadInput(`Falta: ${field}`)
  if (v.length > max) throw new BadInput(`${field} es demasiado largo`)
  return v
}

function integer(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) throw new BadInput(`${field} no es válido`)
  return value
}

function parseProduct(b) {
  if (!b || typeof b !== 'object') throw new BadInput('Datos no válidos')
  if (!Array.isArray(b.variants) || b.variants.length < 1 || b.variants.length > 30) {
    throw new BadInput('El producto necesita al menos una variante')
  }
  if (!Array.isArray(b.sizes) || b.sizes.length > 30) throw new BadInput('Tallas no válidas')
  const variants = b.variants.map((v) => {
    const images = v?.images
    if (!Array.isArray(images) || images.length < 1 || images.length > 30 ||
        !images.every((i) => typeof i === 'string' && IMAGE_URL.test(i))) {
      throw new BadInput('Cada variante debe tener al menos una imagen válida')
    }
    return {
      colorName: text(v.colorName, 'Color', 60) || 'Único',
      color: /^#[0-9a-f]{6}$/i.test(v.color) ? v.color : '#1a1a1a',
      images,
    }
  })
  return {
    name: text(b.name, 'Nombre', 120, true),
    category: text(b.category, 'Categoría', 120),
    description: text(b.description, 'Descripción', 4000),
    material: text(b.material, 'Material', 2000),
    price: integer(b.price, 'Precio'),
    stock: integer(b.stock, 'Stock'),
    sizes: JSON.stringify(b.sizes.map((s) => text(s, 'Talla', 20)).filter(Boolean)),
    variants: JSON.stringify(variants),
  }
}

async function readJson(request) {
  const body = await request.text()
  if (body.length > MAX_BODY) throw new BadInput('Datos demasiado grandes')
  try { return JSON.parse(body) } catch { throw new BadInput('Datos no válidos') }
}

async function readImage(request) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0]
  if (!IMAGE_TYPES[type]) throw new BadInput('Formato de imagen no permitido')
  if (Number(request.headers.get('Content-Length')) > MAX_IMAGE) throw new BadInput('La imagen es demasiado grande')
  const data = await request.arrayBuffer()
  if (!data.byteLength || data.byteLength > MAX_IMAGE) throw new BadInput('La imagen es demasiado grande')
  return { type, data }
}

const ADMIN = { name: 'Administrador' }

function withCookie(data, cookie) {
  const res = json(data)
  res.headers.append('Set-Cookie', cookie)
  return res
}

async function handleLogin(request, env) {
  if (!isConfigured(env) || !env.LOGIN_LIMIT) return fail('El acceso todavía no está configurado', 503)
  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida'
  const { success } = await env.LOGIN_LIMIT.limit({ key: ip })
  if (!success) return fail('Demasiados intentos. Espera un minuto.', 429)
  const body = await readJson(request)
  if (!(await checkKey(body?.key, env))) return fail('Clave incorrecta', 403)
  return withCookie(ADMIN, await sessionCookie(env))
}

async function handleAdmin(request, env, url) {
  const { method } = request
  // Evita que otra web escriba usando la sesión del administrador.
  if (method !== 'GET' && request.headers.get('Origin') !== url.origin) {
    return fail('Origen no permitido', 403)
  }
  const path = url.pathname.slice('/api/admin'.length)

  if (path === '/login' && method === 'POST') return handleLogin(request, env)
  if (path === '/logout' && method === 'POST') return withCookie({ ok: true }, clearCookie())

  if (!(await isAdmin(request, env))) return fail('No autorizado', 401)
  if (path === '/session' && method === 'GET') return json(ADMIN)
  if (path === '/pedidos' && method === 'GET') return json(await listOrders(env))

  if (path === '/images' && method === 'POST') {
    const { type, data } = await readImage(request)
    const key = `${crypto.randomUUID()}.${IMAGE_TYPES[type]}`
    await env.FOTOS.put(key, data, { metadata: { type } })
    return json({ url: `/img/${key}` }, 201)
  }

  if (path === '/products' && method === 'POST') {
    const p = parseProduct(await readJson(request))
    const id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO products (id,name,category,description,material,price,stock,sizes,variants,reviews,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,'[]',?)`
    ).bind(id, p.name, p.category, p.description, p.material, p.price, p.stock, p.sizes, p.variants,
      new Date().toISOString()).run()
    return json({ id }, 201)
  }

  const match = path.match(/^\/products\/([\w-]{1,64})$/)
  if (match && method === 'PUT') {
    const p = parseProduct(await readJson(request))
    const r = await env.DB.prepare(
      `UPDATE products SET name=?,category=?,description=?,material=?,price=?,stock=?,sizes=?,variants=? WHERE id=?`
    ).bind(p.name, p.category, p.description, p.material, p.price, p.stock, p.sizes, p.variants, match[1]).run()
    return r.meta.changes ? json({ id: match[1] }) : fail('El producto ya no existe', 404)
  }
  if (match && method === 'DELETE') {
    const r = await env.DB.prepare('DELETE FROM products WHERE id=?').bind(match[1]).run()
    return r.meta.changes ? json({ ok: true }) : fail('El producto ya no existe', 404)
  }
  return fail('No encontrado', 404)
}

async function handle(request, env, ctx) {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname.startsWith('/api/admin/')) return handleAdmin(request, env, url)
  if (pathname.startsWith('/api/pedidos') || pathname === '/api/wompi/eventos') {
    return handleOrders(request, env, url, readJson, json)
  }
  if (pathname.startsWith('/api/cuenta/')) return handleCustomers(request, env, url, readJson, json, ctx)

  // La administración no tiene botón en la tienda: se entra escribiendo /admin.
  if ((pathname === '/admin' || pathname === '/admin/') && request.method === 'GET') {
    const res = await env.ASSETS.fetch(new Request(new URL('/', url), request))
    const page = new Response(res.body, res)
    page.headers.set('Cache-Control', 'no-store')
    return page
  }

  if (pathname === '/api/products' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
    return json(results.map(toProduct))
  }

  const img = pathname.match(/^\/img\/([A-Za-z0-9-]+\.(webp|jpg|png))$/)
  if (img && request.method === 'GET') {
    const { value, metadata } = await env.FOTOS.getWithMetadata(img[1], { type: 'stream', cacheTtl: 86400 })
    if (!value) return new Response('No encontrada', { status: 404 })
    return new Response(value, {
      headers: {
        'Content-Type': metadata?.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/img/')) return fail('No encontrado', 404)
  return env.ASSETS.fetch(request)
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handle(request, env, ctx)
    } catch (err) {
      if (err instanceof BadInput) return fail(err.message, 400)
      if (err instanceof OrderError) return fail(err.message, err.status)
      if (err instanceof CustomerError) return fail(err.message, err.status)
      console.error(err)
      return fail('Error interno', 500)
    }
  },
}
