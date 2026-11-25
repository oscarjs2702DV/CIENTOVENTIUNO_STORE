async function request(path, options) {
  let res
  try {
    res = await fetch(path, options)
  } catch {
    throw new Error('No hay conexión con el servidor')
  }
  if (res.status === 401) {
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
export const login = (key) => send('/api/admin/login', 'POST', { key })
export const logout = () => send('/api/admin/logout', 'POST', {})
export const getCustomer = () => request('/api/cuenta/sesion')
export const registerCustomer = (data) => send('/api/cuenta/registro', 'POST', data)
export const loginCustomer = (data) => send('/api/cuenta/ingresar', 'POST', data)
export const logoutCustomer = () => send('/api/cuenta/salir', 'POST', {})
export const createProduct = (p) => send('/api/admin/products', 'POST', p)
export const updateProduct = (id, p) => send(`/api/admin/products/${id}`, 'PUT', p)
export const deleteProduct = (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' })
export const uploadImage = async (blob) => {
  const { url } = await request('/api/admin/images', {
    method: 'POST', headers: { 'Content-Type': blob.type }, body: blob,
  })
  return url
}
export const updateProfile = (data) => send('/api/cuenta/perfil', 'PUT', data)
export const uploadAvatar = (blob) =>
  request('/api/cuenta/foto', { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob })
export const removeAvatar = () => request('/api/cuenta/foto', { method: 'DELETE' })
