import { create } from 'zustand'

// La administración vive en /admin (sin botón en la tienda); el resto usa
// rutas con # para no recargar la página.
function readHash() {
  const path = window.location.pathname.replace(/\/+$/, '')
  const hash = window.location.hash.replace(/^#/, '')
  if (path === '/admin') return { view: 'admin', selectedProductId: null }
  // Wompi devuelve al cliente a /?pedido=<referencia>&id=<transacción>.
  const params = new URLSearchParams(window.location.search)
  if (params.get('pedido')) {
    return { view: 'pedido', selectedProductId: null, order: { ref: params.get('pedido'), txId: params.get('id') } }
  }
  if (hash === '/pago') return { view: 'pago', selectedProductId: null }
  if (hash === '/cuenta') return { view: 'cuenta', selectedProductId: null }
  if (hash.startsWith('/info/')) return { view: 'info', selectedProductId: null, infoSlug: hash.slice(6) }
  if (hash.startsWith('/product/')) {
    const id = hash.replace('/product/', '')
    return { view: 'product', selectedProductId: id }
  }
  return { view: 'store', selectedProductId: null }
}

function writeHash(view, selectedProductId) {
  let url = '/'
  if (view === 'admin') url = '/admin'
  else if (view === 'cuenta') url = '/#/cuenta'
  else if (view === 'pago') url = '/#/pago'
  else if (view === 'pedido') return
  else if (view === 'info') return
  else if (view === 'product' && selectedProductId) url = `/#/product/${selectedProductId}`
  const { pathname, search, hash } = window.location
  if (pathname + search + hash !== url) window.history.replaceState(null, '', url)
}

const initial = readHash()

export const useUI = create((set, get) => ({
  view: initial.view,
  selectedProductId: initial.selectedProductId,
  infoSlug: initial.infoSlug || null,
  order: initial.order || null,

  // Color con el que se abre el producto (el que se eligió en la tarjeta).
  initialVariant: 0,
  openProduct: (id, variant = 0) => {
    set({ view: 'product', selectedProductId: id, initialVariant: Number.isInteger(variant) ? variant : 0 })
    writeHash('product', id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  },
  backToStore: () => {
    set({ view: 'store', selectedProductId: null })
    writeHash('store', null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  },
  goAdmin: () => {
    set({ view: 'admin' })
    writeHash('admin', null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  },
  goAccount: () => {
    set({ view: 'cuenta', selectedProductId: null })
    writeHash('cuenta', null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  },
  goCheckout: () => {
    set({ view: 'pago', selectedProductId: null })
    writeHash('pago', null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  },
  syncFromHash: () => {
    const { view, selectedProductId, infoSlug = null, order = null } = readHash()
    set({ view, selectedProductId, infoSlug, order })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => useUI.getState().syncFromHash())
}
