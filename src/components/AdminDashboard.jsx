import { useState, useEffect, useCallback } from 'react'
import {
  Package, Boxes, AlertOctagon, Plus, Pencil, Trash2, X, LogOut,
  Store, Shield, Save, Upload, ImageIcon,
} from 'lucide-react'
import { listOrders, listProducts, createProduct, updateProduct, deleteProduct, uploadImage } from '../lib/api'
import { useAuth } from '../store/authStore'
import { useUI } from '../store/uiStore'
import { useToast } from '../store/toastStore'
import { formatCOP } from '../data/products'
import ConfirmDialog from './ConfirmDialog'

function getProductImage(product) {
  if (product.variants && product.variants[0]?.images?.length > 0) return product.variants[0].images[0]
  if (product.images && product.images.length > 0) return product.images[0]
  if (product.image) return product.image
  return null
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const backToStore = useUI((s) => s.backToStore)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [confirmState, setConfirmState] = useState(null)
  const toast = useToast()

  const fetchProducts = useCallback(async () => {
    try {
      setProducts(await listProducts())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
  const agotados = products.filter((p) => p.stock <= 0).length

  const handleDelete = (id, name) => {
    setConfirmState({ id, name })
  }

  const confirmDelete = async () => {
    if (!confirmState) return
    const { id, name } = confirmState
    setConfirmState(null)
    try {
      await deleteProduct(id)
      toast.success(`"${name}" eliminado del catálogo`)
      fetchProducts()
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-grape/20">
              <Shield size={20} className="text-grape" />
            </div>
            <div>
              <h1 className="font-display text-xl uppercase tracking-widest2 text-white">CIENTOVEINTIUNO</h1>
              <p className="font-body text-xs text-chalk/50">Panel de Administración</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-body text-sm text-chalk/60 sm:block">{user?.name}</span>
            <button onClick={backToStore} className="flex items-center gap-1.5 border border-white/20 px-4 py-2 font-display text-sm uppercase tracking-widest2 text-chalk transition-colors hover:border-grape hover:text-grape">
              <Store size={16} /> Tienda
            </button>
            <button onClick={signOut} aria-label="Cerrar sesión" className="flex items-center gap-1.5 border border-red-500/40 px-4 py-2 font-display text-sm uppercase tracking-widest2 text-red-400 transition-all hover:bg-red-500/10">
              <LogOut size={16} /> <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard icon={Package} label="Total Productos" value={totalProducts} color="grape" />
          <MetricCard icon={Boxes} label="Unidades en Stock" value={totalStock} color="emerald" />
          <MetricCard icon={AlertOctagon} label="Productos Agotados" value={agotados} color="red" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-widest2 text-white">Gestión de Inventario</h2>
          <button onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 bg-grape px-5 py-2.5 font-display text-sm uppercase tracking-widest2 text-white transition-all hover:bg-grapeDark hover:shadow-[0_6px_24px_rgba(138,43,226,0.45)] active:scale-95">
            <Plus size={18} /> Añadir Producto
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center font-display text-xl uppercase tracking-widest2 text-chalk/50">Cargando inventario...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center font-display text-xl uppercase tracking-widest2 text-chalk/50">No hay productos en el inventario</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 font-display text-sm uppercase tracking-widest2 text-chalk">Producto</th>
                  <th className="px-4 py-3 font-display text-sm uppercase tracking-widest2 text-chalk">Precio</th>
                  <th className="px-4 py-3 font-display text-sm uppercase tracking-widest2 text-chalk">Stock</th>
                  <th className="px-4 py-3 font-display text-sm uppercase tracking-widest2 text-chalk">Estado</th>
                  <th className="px-4 py-3 font-display text-sm uppercase tracking-widest2 text-chalk">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const thumb = getProductImage(p)
                  return (
                    <tr key={p.id} className="border-b border-white/5 transition-colors hover:bg-plum/20">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img src={thumb} alt={p.name} className="h-14 w-12 flex-shrink-0 object-cover ring-1 ring-white/10" />
                          ) : (
                            <div className="flex h-14 w-12 flex-shrink-0 items-center justify-center bg-plum/30 ring-1 ring-white/10">
                              <ImageIcon size={18} className="text-white/30" />
                            </div>
                          )}
                          <div>
                            <p className="font-display text-base uppercase tracking-wide text-white">{p.name}</p>
                            <p className="font-body text-xs text-chalk/50">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-display text-lg text-white">{formatCOP(p.price)}</td>
                      <td className="px-4 py-4 font-body text-lg text-white">{p.stock}</td>
                      <td className="px-4 py-4">
                        {p.stock > 0 ? (
                          <span className="inline-block border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-display text-xs uppercase tracking-widest2 text-emerald-400">En stock</span>
                        ) : (
                          <span className="inline-block border border-red-500/40 bg-red-500/10 px-3 py-1 font-display text-xs uppercase tracking-widest2 text-red-400">Agotado</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setModal({ type: 'edit', product: p })} className="flex items-center gap-1 border border-white/20 px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-chalk transition-colors hover:border-grape hover:text-grape">
                            <Pencil size={14} /> Editar
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="flex items-center gap-1 border border-red-500/30 px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-red-400 transition-colors hover:bg-red-500/10">
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <OrdersSection />
      </div>

      {modal && (
        <ProductModal
          mode={modal.type}
          product={modal.type === 'edit' ? modal.product : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmState}
        title="Eliminar producto"
        message={`¿Eliminar "${confirmState?.name || ''}" del catálogo? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}

const ORDER_STATUS = {
  APPROVED: ['Pagado', 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'],
  PENDING: ['Pendiente', 'border-amber-500/40 bg-amber-500/10 text-amber-300'],
  DECLINED: ['Rechazado', 'border-red-500/40 bg-red-500/10 text-red-400'],
  VOIDED: ['Anulado', 'border-red-500/40 bg-red-500/10 text-red-400'],
  ERROR: ['Error', 'border-red-500/40 bg-red-500/10 text-red-400'],
}

function OrdersSection() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null)
  const [onlyPaid, setOnlyPaid] = useState(true)
  const load = useCallback(() => {
    listOrders().then(setOrders, (e) => setError(e.message))
  }, [])
  useEffect(load, [load])
  const shown = (orders || []).filter((o) => !onlyPaid || o.status === 'APPROVED')

  return (
    <div className="mt-16">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase tracking-widest2 text-white">Pedidos</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-body text-sm text-chalk/70">
            <input type="checkbox" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} className="accent-grape" />
            Solo pagados
          </label>
          <button onClick={load} className="border border-white/20 px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-chalk hover:border-grape hover:text-grape">Actualizar</button>
        </div>
      </div>
      {error ? (
        <p className="font-body text-red-400">{error}</p>
      ) : !orders ? (
        <p className="py-10 text-center font-display text-xl uppercase tracking-widest2 text-chalk/50">Cargando pedidos...</p>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center font-display text-xl uppercase tracking-widest2 text-chalk/50">No hay pedidos todavía</p>
      ) : (
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {shown.map((o) => {
            const [label, cls] = ORDER_STATUS[o.status] || ORDER_STATUS.PENDING
            const b = o.buyer
            return (
              <li key={o.reference} className="py-4">
                <button onClick={() => setOpen(open === o.reference ? null : o.reference)} className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 text-left">
                  <span className={`border px-3 py-1 font-display text-xs uppercase tracking-widest2 ${cls}`}>{label}</span>
                  <span className="font-body text-sm text-chalk/60">{new Date(o.createdAt).toLocaleString('es-CO')}</span>
                  <span className="font-display text-base uppercase tracking-wide text-white">{b.name}</span>
                  <span className="font-body text-sm text-chalk/60">{b.city}</span>
                  <span className="ml-auto font-display text-lg text-white">{formatCOP(o.total)}</span>
                </button>
                {open === o.reference && (
                  <div className="mt-4 grid gap-6 bg-plum/20 p-4 font-body text-sm text-chalk/80 md:grid-cols-2">
                    <div className="space-y-1">
                      <p><span className="text-chalk/50">Referencia:</span> {o.reference}</p>
                      <p><span className="text-chalk/50">Documento:</span> {b.docType} {b.doc}</p>
                      <p><span className="text-chalk/50">Correo:</span> {b.email}</p>
                      <p><span className="text-chalk/50">Celular:</span> {b.phone}</p>
                      <p><span className="text-chalk/50">Dirección:</span> {b.address}, {b.city}, {b.department}</p>
                      {b.notes && <p><span className="text-chalk/50">Notas:</span> {b.notes}</p>}
                      {o.paymentMethod && <p><span className="text-chalk/50">Pago:</span> {o.paymentMethod} · {o.transactionId}</p>}
                    </div>
                    <ul className="space-y-1">
                      {o.items.map((i, n) => (
                        <li key={n} className="flex justify-between gap-4">
                          <span>{i.name} · {i.color} · {i.size} · x{i.qty}</span><span>{formatCOP(i.price * i.qty)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-4 text-chalk/50"><span>Envío</span><span>{o.shipping ? formatCOP(o.shipping) : 'Gratis'}</span></li>
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    grape: 'border-grape/30 bg-grape/5 text-grape',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
  }
  return (
    <div className={`flex items-center gap-4 border p-5 ${colorMap[color]}`}>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
        <Icon size={24} />
      </div>
      <div>
        <p className="font-body text-sm text-chalk/60">{label}</p>
        <p className="font-display text-3xl text-white">{value}</p>
      </div>
    </div>
  )
}

function compressImage(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height / width) * maxDim)
          width = maxDim
        } else {
          width = Math.round((width / height) * maxDim)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('No se pudo comprimir la imagen')); return }
        resolve(blob)
      }, 'image/webp', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen')) }
    img.src = url
  })
}

async function uploadImageToStorage(file) {
  return uploadImage(await compressImage(file))
}

function ProductModal({ mode, product, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(() => {
    if (product) {
      const rawVariants = (product.variants && product.variants.length > 0)
        ? product.variants
        : [{ colorName: 'Único', color: '#1a1a1a', images: (product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])) }]
      const variants = rawVariants.map((v) => ({
        colorName: v.colorName || v.name || 'Único',
        color: v.color || '#1a1a1a',
        images: (v.images && v.images.length > 0)
          ? v.images
          : (v.image ? [v.image] : []),
      }))
      return {
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        price: String(product.price || ''),
        stock: String(product.stock || 0),
        sizes: (product.sizes || []).join(', '),
        material: product.material || '',
        variants,
      }
    }
    return {
      name: '', category: '', description: '', price: '', stock: '', sizes: 'S, M, L, XL, XXL', material: '',
      variants: [{ colorName: 'Único', color: '#1a1a1a', images: [] }],
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeVariantIdx, setActiveVariantIdx] = useState(0)
  const toast = useToast()

  const activeVariant = form.variants[activeVariantIdx]

  const [uploading, setUploading] = useState(false)

  const handleVariantFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const urls = []
      for (const file of files) {
        const url = await uploadImageToStorage(file)
        urls.push(url)
      }
      setForm((prev) => {
        const variants = [...prev.variants]
        variants[activeVariantIdx] = {
          ...variants[activeVariantIdx],
          images: [...variants[activeVariantIdx].images, ...urls],
        }
        return { ...prev, variants }
      })
    } catch (err) {
      setError('Error al subir las imágenes: ' + err.message)
      toast.error('Error al subir las imágenes')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeVariantImage = (imgIndex) => {
    setForm((prev) => {
      const variants = [...prev.variants]
      variants[activeVariantIdx] = {
        ...variants[activeVariantIdx],
        images: variants[activeVariantIdx].images.filter((_, i) => i !== imgIndex),
      }
      return { ...prev, variants }
    })
  }

  const moveVariantImage = (imgIndex, dir) => {
    setForm((prev) => {
      const variants = [...prev.variants]
      const imgs = [...variants[activeVariantIdx].images]
      const target = imgIndex + dir
      if (target < 0 || target >= imgs.length) return prev
      ;[imgs[imgIndex], imgs[target]] = [imgs[target], imgs[imgIndex]]
      variants[activeVariantIdx] = { ...variants[activeVariantIdx], images: imgs }
      return { ...prev, variants }
    })
  }

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { colorName: '', color: '#1a1a1a', images: [] }],
    }))
    setActiveVariantIdx(form.variants.length)
  }

  const removeVariant = (idx) => {
    if (form.variants.length <= 1) return
    setForm((prev) => {
      const variants = prev.variants.filter((_, i) => i !== idx)
      return { ...prev, variants }
    })
    if (activeVariantIdx >= form.variants.length - 1) {
      setActiveVariantIdx(Math.max(0, activeVariantIdx - 1))
    }
  }

  const updateVariant = (field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants]
      variants[activeVariantIdx] = { ...variants[activeVariantIdx], [field]: value }
      return { ...prev, variants }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const hasImages = form.variants.every((v) => v.images.length > 0)
    if (!hasImages) {
      setError('Cada variante debe tener al menos una imagen')
      setSaving(false)
      return
    }

    const sizes = form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    const cleanVariants = form.variants.map((v) => ({
      colorName: v.colorName || 'Único',
      color: v.color || '#1a1a1a',
      images: v.images,
    }))

    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      price: parseInt(form.price) || 0,
      variants: cleanVariants,
      sizes,
      material: form.material,
      stock: parseInt(form.stock) || 0,
    }

    try {
      if (isEdit) await updateProduct(product.id, payload)
      else await createProduct(payload)
      toast.success(isEdit ? 'Producto actualizado con éxito' : 'Producto creado con éxito')
      onSaved()
    } catch (err) {
      setError(err.message)
      toast.error('Error al guardar: ' + err.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 animate-fadeIn" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-ink p-6 shadow-2xl animate-slideIn">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-widest2 text-white">
            {isEdit ? 'Editar Producto' : 'Crear Producto'}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-chalk transition-colors hover:text-white">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 border border-red-500/40 bg-red-500/10 px-4 py-3">
            <p className="font-body text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Nombre del producto" required>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
            <Field label="Categoría / Estilo">
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej: Camisetas · Oversize"
                className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
            <Field label="Precio (COP)" required>
              <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="75000" className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
            <Field label="Stock (unidades)" required>
              <input type="number" required min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="50" className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
          </div>

          {/* Variants section */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-display text-sm uppercase tracking-widest2 text-chalk">
                Variantes (Colores / Diseños) <span className="text-grape">*</span>
              </label>
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1 border border-grape/40 px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-grape transition-colors hover:bg-grape/10">
                <Plus size={14} /> Añadir variante
              </button>
            </div>

            {/* Variant tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {form.variants.map((v, i) => (
                <button key={i} type="button" onClick={() => setActiveVariantIdx(i)}
                  className={`flex items-center gap-2 px-3 py-2 font-display text-xs uppercase tracking-widest2 transition-all ${
                    activeVariantIdx === i
                      ? 'bg-grape text-white'
                      : 'border border-white/15 text-chalk hover:border-grape hover:text-grape'
                  }`}>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: v.color }} />
                  {v.colorName || `Variante ${i + 1}`}
                  {form.variants.length > 1 && (
                    <span onClick={(e) => { e.stopPropagation(); removeVariant(i) }} className="ml-1 text-white/60 hover:text-red-400">
                      <X size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active variant editor */}
            <div className="border border-white/10 bg-plum/10 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre del color">
                  <input type="text" value={activeVariant.colorName} onChange={(e) => updateVariant('colorName', e.target.value)}
                    placeholder="Ej: Azul Oscuro, Negro"
                    className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
                </Field>
                <div>
                  <label className="mb-1.5 block font-display text-sm uppercase tracking-widest2 text-chalk">Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={activeVariant.color} onChange={(e) => updateVariant('color', e.target.value)}
                      className="h-10 w-16 cursor-pointer border border-white/15 bg-transparent" />
                    <input type="text" value={activeVariant.color} onChange={(e) => updateVariant('color', e.target.value)}
                      className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Variant image upload */}
              <div className="mt-4">
                <p className="mb-2 font-body text-xs text-chalk/50">
                  Imágenes de esta variante. La primera será la foto principal.
                </p>
                <label className={`flex cursor-pointer items-center justify-center gap-2 border-2 border-dashed px-4 py-6 transition-colors ${uploading ? 'border-grape bg-grape/5' : 'border-white/20 bg-plum/20 hover:border-grape hover:bg-grape/5'}`}>
                  <input type="file" multiple accept="image/*" onChange={handleVariantFileSelect} className="hidden" disabled={uploading} />
                  <Upload size={20} className="text-chalk/60" />
                  <span className="font-display text-sm uppercase tracking-widest2 text-chalk/70">{uploading ? 'Subiendo...' : 'Seleccionar imágenes'}</span>
                </label>

                {activeVariant.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {activeVariant.images.map((img, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden ring-1 ring-white/10">
                        <img src={img} alt={`Variante ${i + 1}`} className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute left-1 top-1 bg-grape px-1.5 py-0.5 font-display text-[10px] uppercase tracking-widest2 text-white">
                            Principal
                          </span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-ink/70 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" onClick={() => moveVariantImage(i, -1)} disabled={i === 0}
                            className="rounded bg-white/10 px-1.5 py-1 text-white transition-colors hover:bg-grape disabled:opacity-30" aria-label="Mover izquierda">←</button>
                          <button type="button" onClick={() => removeVariantImage(i)}
                            className="rounded bg-red-500/40 p-1 text-white transition-colors hover:bg-red-500" aria-label="Eliminar imagen">
                            <Trash2 size={14} />
                          </button>
                          <button type="button" onClick={() => moveVariantImage(i, 1)} disabled={i === activeVariant.images.length - 1}
                            className="rounded bg-white/10 px-1.5 py-1 text-white transition-colors hover:bg-grape disabled:opacity-30" aria-label="Mover derecha">→</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Tallas (separadas por coma)" full>
              <input type="text" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
            <Field label="Descripción" full>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
            <Field label="Material" full>
              <input type="text" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="Ej: Algodón perchado 260 gr" className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
            </Field>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={saving || uploading}
              className="flex flex-1 items-center justify-center gap-2 bg-grape px-8 py-3.5 font-display text-lg uppercase tracking-widest2 text-white transition-all hover:bg-grapeDark hover:shadow-[0_8px_30px_rgba(138,43,226,0.45)] active:scale-95 disabled:opacity-50">
              {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Producto'}
              <Save size={18} />
            </button>
            <button type="button" onClick={onClose}
              className="border border-white/20 px-6 py-3.5 font-display text-lg uppercase tracking-widest2 text-chalk transition-colors hover:text-white">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block font-display text-sm uppercase tracking-widest2 text-chalk">
        {label} {required && <span className="text-grape">*</span>}
      </label>
      {children}
    </div>
  )
}
