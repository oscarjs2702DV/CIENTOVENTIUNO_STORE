async function request(path, options) {
  let res
  try {
    // Con la sesión de Access vencida la respuesta es una redirección al login.
    res = await fetch(path, { redirect: 'manual', ...options })
  } catch {
    throw new Error('No hay conexión con el servidor')
  }
  if (res.type === 'opaqueredirect' || res.status === 401) {
    throw new Error('Tu sesión venció. Vuelve a ingresar.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok || data === null) throw new Error(data?.error || 'Error del servidor')
  return data
}

const send = (path, method, body) =>
  request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const listProducts = () => request('/api/products')
export const getSession = () => request('/api/admin/session')
export const createProduct = (p) => send('/api/admin/products', 'POST', p)
export const updateProduct = (id, p) => send(`/api/admin/products/${id}`, 'PUT', p)
export const deleteProduct = (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' })
export const uploadImage = async (blob) => {
  const { url } = await request('/api/admin/images', {
    method: 'POST', headers: { 'Content-Type': blob.type }, body: blob,
  })
  return url
}
