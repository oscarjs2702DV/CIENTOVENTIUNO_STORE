import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  Truck,
  ChevronDown,
  Star,
  ImageOff,
  Maximize2,
} from 'lucide-react'
import { listProducts } from '../lib/api'
import { formatCOP } from '../data/products'
import { useCart } from '../store/cartStore'
import { useCustomer } from '../store/customerStore'
import { useUI } from '../store/uiStore'
import { normalizeVariants } from '../lib/variants'
import { useToast } from '../store/toastStore'
import { isLowStock, lowStockText } from '../lib/stock'
import Lightbox from './Lightbox'

function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= rating ? 'fill-grape text-grape' : 'text-white/20'} />
      ))}
    </div>
  )
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-white/10">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="font-display text-xl uppercase tracking-widest2 text-white">{title}</span>
        <ChevronDown size={20} className={`text-chalk transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const productId = useUI((s) => s.selectedProductId)
  const backToStore = useUI((s) => s.backToStore)
  const openProduct = useUI((s) => s.openProduct)
  const goBack = useUI((s) => s.goBack)
  const add = useCart((s) => s.add)
  const openCart = useCart((s) => s.open)
  const toast = useToast()
  const customer = useCustomer((s) => s.user)
  const goLogin = useUI((s) => s.goLogin)
  // Solo los clientes registrados pueden añadir a la bolsa y comprar.
  const needLogin = () => {
    if (customer) return false
    toast.info('Ingresa o crea tu cuenta para añadir prendas a la bolsa')
    goLogin()
    return true
  }

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeVariant, setActiveVariant] = useState(0)
  const [activeImage, setActiveImage] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [lightbox, setLightbox] = useState(null)      // foto abierta a pantalla completa
  const [lens, setLens] = useState(null)              // zoom al pasar el mouse: punto de origen
  const [shake, setShake] = useState(false)
  const sizesRef = useRef(null)
  const swipe = useRef(null)

  useEffect(() => {
    setActiveVariant(useUI.getState().initialVariant || 0)
    setActiveImage(null)
    setSelectedSize(null)
    setAdded(false)
    setImgError(false)
    setShowWarning(false)
    setLightbox(null)
    setLoading(true)

    let active = true
    listProducts()
      .then((all) => {
        if (!active) return
        setProduct(all.find((p) => p.id === productId) || null)
        setRelated(all.filter((p) => p.id !== productId).slice(0, 4))
      })
      .catch(() => { if (active) setProduct(null) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [productId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-20">
        <p className="font-display text-2xl uppercase tracking-widest2 text-chalk/50">Cargando producto...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink pt-20">
        <p className="font-display text-2xl uppercase tracking-widest2 text-chalk/60">Producto no disponible</p>
        <button onClick={backToStore} className="btn-primary">Volver a la tienda</button>
      </div>
    )
  }

  const variants = normalizeVariants(product)
  const currentVariant = variants[activeVariant] || variants[0]
  const gallery = currentVariant.images.length > 0 ? currentVariant.images : (product.image ? [product.image] : [])
  const resolvedActiveImage = activeImage || gallery[0] || product.image
  const selectedColor = currentVariant.colorName
  const agotado = product.stock <= 0
  const pocas = isLowStock(product)
  const activeIndex = Math.max(0, gallery.indexOf(resolvedActiveImage))
  const reviews = product.reviews || []
  const hasMultipleVariants = variants.length > 1 || variants[0].colorName !== 'Único'

  const handleVariantChange = (i) => {
    setActiveVariant(i)
    setActiveImage(null)
    setImgError(false)
  }

  const askForSize = () => {
    setShowWarning(true)
    setShake(false)
    requestAnimationFrame(() => setShake(true))
    sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    toast.error('Debes seleccionar una talla antes de agregar a la bolsa')
    setTimeout(() => setShowWarning(false), 3000)
  }

  const showImage = (i) => {
    setActiveImage(gallery[(i + gallery.length) % gallery.length])
    setImgError(false)
  }

  const onLens = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    setLens(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
  }

  const onSwipeStart = (e) => {
    const t = e.touches[0]
    swipe.current = { x: t.clientX, y: t.clientY }
  }
  const onSwipeEnd = (e) => {
    const start = swipe.current
    swipe.current = null
    if (!start || gallery.length < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(t.clientY - start.y)) showImage(activeIndex + (dx < 0 ? 1 : -1))
  }

  const handleAdd = () => {
    if (agotado || needLogin()) return
    if (!selectedSize) {
      askForSize()
      return
    }
    add(product, selectedSize, selectedColor, resolvedActiveImage)
    toast.success('Producto añadido a la bolsa')
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleViewCart = () => {
    if (agotado || needLogin()) return
    if (!selectedSize) {
      askForSize()
      return
    }
    add(product, selectedSize, selectedColor, resolvedActiveImage)
    toast.success('Producto añadido a la bolsa')
    openCart()
  }

  return (
    <div className="min-h-screen bg-ink pt-20">
      <div className="mx-auto max-w-[1920px] px-4 py-6 lg:px-[100px] xl:px-[200px]">
        <button onClick={goBack} className="flex items-center gap-2 font-display text-lg uppercase tracking-widest2 text-chalk transition-colors hover:text-grape">
          <ArrowLeft size={20} />
          Volver a la tienda
        </button>
      </div>

      <div className="mx-auto max-w-[1920px] px-4 pb-20 lg:px-[100px] xl:px-[200px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: gallery */}
          <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-6">
            <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-neutral-900 ring-1 ring-white/10">
              {imgError || !resolvedActiveImage ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-plum/40">
                  <ImageOff size={48} className="text-white/30" />
                  <span className="font-display text-xl uppercase tracking-widest2 text-white/40">CIENTOVEINTIUNO</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLightbox(activeIndex)}
                  onPointerMove={onLens}
                  onPointerLeave={() => setLens(null)}
                  onTouchStart={onSwipeStart}
                  onTouchEnd={onSwipeEnd}
                  aria-label="Ver foto a pantalla completa"
                  className="group/zoom block h-full w-full cursor-zoom-in"
                >
                  <img
                    key={resolvedActiveImage}
                    src={resolvedActiveImage}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    className="h-full w-full animate-fadeIn object-cover transition-transform duration-300 ease-out"
                    style={lens ? { transform: 'scale(1.7)', transformOrigin: lens } : undefined}
                  />
                  <span className="pointer-events-none absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-ink/60 text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors group-hover/zoom:bg-grape">
                    <Maximize2 size={18} />
                  </span>
                  {gallery.length > 1 && (
                    <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden">
                      {gallery.map((_, i) => (
                        <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
                      ))}
                    </span>
                  )}
                </button>
              )}
              {agotado && (
                <div className="absolute left-4 top-4 z-10 bg-red-500/90 px-4 py-2 font-display text-base uppercase tracking-widest2 text-white">
                  Agotado
                </div>
              )}
            </div>
            <div className="flex gap-3 lg:flex-col lg:gap-4">
              {gallery.map((img, i) => (
                <button key={i} onClick={() => { setActiveImage(img); setImgError(false) }}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden ring-2 transition-all lg:h-24 lg:w-24 ${
                    resolvedActiveImage === img ? 'ring-grape' : 'ring-white/10 hover:ring-white/40'
                  }`}>
                  <img src={img} alt={`${product.name} vista ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: purchase info */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="font-script text-2xl text-grape">{product.category}</span>
              <h1 className="mt-1 font-display text-4xl uppercase tracking-widest2 text-white sm:text-5xl">{product.name}</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-display text-4xl tracking-wide text-white">{formatCOP(product.price)}</span>
              <span className="font-body text-sm text-chalk/50">· Precio con IVA incluido</span>
            </div>

            {pocas && (
              <div className="flex items-center gap-3 border border-grape/40 bg-grape/10 px-4 py-3">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-grape opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-grape" />
                </span>
                <p className="font-display text-base uppercase tracking-widest2 text-white">
                  {lowStockText(product.stock)}
                </p>
              </div>
            )}

            {agotado && (
              <div className="border border-red-500/40 bg-red-500/10 px-4 py-3">
                <p className="font-display text-base uppercase tracking-widest2 text-red-400">
                  Producto agotado · No disponible para compra
                </p>
              </div>
            )}

            {/* Variants / Designs */}
            {hasMultipleVariants && (
              <div>
                <p className="mb-3 font-display text-lg uppercase tracking-widest2 text-chalk">
                  Diseño: <span className="text-white">{currentVariant.colorName}</span>
                </p>
                <div className="flex gap-3">
                  {variants.map((v, i) => {
                    const vThumb = v.images[0]
                    return (
                      <button key={i} onClick={() => handleVariantChange(i)}
                        aria-label={v.colorName}
                        className={`relative h-14 w-14 overflow-hidden ring-2 transition-all hover:scale-110 ${
                          activeVariant === i ? 'ring-grape' : 'ring-white/10 hover:ring-white/40'
                        }`}>
                        {vThumb ? (
                          <img src={vThumb} alt={v.colorName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-plum/40">
                            <ImageOff size={16} className="text-white/30" />
                          </div>
                        )}
                        <span className="absolute bottom-0 left-0 h-1.5 w-full" style={{ backgroundColor: v.color }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div ref={sizesRef}>
              <p className="mb-3 font-display text-lg uppercase tracking-widest2 text-chalk">
                Talla{selectedSize && <>: <span className="text-white">{selectedSize}</span></>}
              </p>
              <div
                onAnimationEnd={() => setShake(false)}
                className={`flex flex-wrap gap-3 ${shake ? 'animate-shake' : ''}`}
              >
                {(product.sizes || []).map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)} disabled={agotado}
                    aria-pressed={selectedSize === size}
                    className={`relative min-w-[3.5rem] px-4 py-3 font-display text-lg uppercase tracking-widest2 transition-all duration-200 active:scale-90 ${
                      agotado
                        ? 'cursor-not-allowed bg-white/5 text-white/20 ring-1 ring-white/10'
                        : selectedSize === size
                        ? 'scale-105 bg-grape text-white shadow-[0_6px_20px_rgba(138,43,226,0.45)] ring-2 ring-grape ring-offset-2 ring-offset-ink'
                        : showWarning
                        ? 'bg-transparent text-white ring-1 ring-red-400/70 hover:text-grape hover:ring-grape'
                        : 'bg-transparent text-white ring-1 ring-white/20 hover:-translate-y-0.5 hover:text-grape hover:ring-grape'
                    }`}>
                    {size}
                    {selectedSize === size && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 animate-fadeIn items-center justify-center rounded-full bg-white text-grape">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to bag */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={handleAdd} disabled={agotado}
                className={`flex flex-1 items-center justify-center gap-2 px-8 py-4 font-display text-xl uppercase tracking-widest2 transition-all duration-300 ${
                  agotado
                    ? 'cursor-not-allowed bg-white/10 text-white/30'
                    : !selectedSize
                    ? 'bg-white/10 text-white/50 hover:bg-white/15 hover:text-white/80'
                    : added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-grape text-white hover:scale-[1.02] hover:bg-grapeDark hover:shadow-[0_8px_30px_rgba(138,43,226,0.45)] active:scale-95'
                }`}>
                {added ? <Check size={22} /> : <ShoppingBag size={22} />}
                {agotado ? 'Agotado' : added ? 'Añadido a la bolsa' : 'Agregar a la bolsa'}
              </button>
              <button onClick={handleViewCart} disabled={agotado}
                className={`flex items-center justify-center gap-2 border px-6 py-4 font-display text-xl uppercase tracking-widest2 transition-all duration-300 ${
                  agotado
                    ? 'cursor-not-allowed border-white/10 text-white/30'
                    : !selectedSize
                    ? 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                    : 'border-white/20 text-white hover:border-grape hover:text-grape'
                }`}>
                Ver bolsa
              </button>
            </div>
            {showWarning && (
              <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 px-4 py-3">
                <span className="font-body text-sm text-red-300">Debes seleccionar una talla antes de agregar a la bolsa</span>
              </div>
            )}

            {/* Shipping */}
            <div className="flex items-center gap-3 border border-white/10 bg-plum/20 px-5 py-4">
              <Truck size={24} className="flex-shrink-0 text-grape" />
              <div>
                <p className="font-display text-base uppercase tracking-widest2 text-white">Envío gratis a toda Colombia</p>
                <p className="font-body text-sm text-chalk/60">En prendas de más de $70.000 · Despacho en 1-2 días hábiles</p>
              </div>
            </div>

            {/* Accordions */}
            <div className="mt-2">
              <Accordion title="Descripción" defaultOpen>
                <p className="font-body text-base leading-relaxed text-chalk/80">{product.description}</p>
              </Accordion>
              <Accordion title="Material y fabricación">
                <p className="font-body text-base leading-relaxed text-chalk/80">{product.material}</p>
              </Accordion>
              <Accordion title="Reseñas y calificaciones">
                {reviews.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="font-display text-5xl text-white">
                          {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                        </span>
                        <Stars rating={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)} size={16} />
                        <span className="mt-1 font-body text-xs text-chalk/50">{reviews.length} reseñas</span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        {reviews.map((r, i) => (
                          <div key={i} className="border-l-2 border-grape/40 pl-4">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-base uppercase tracking-widest2 text-white">{r.author}</span>
                              <Stars rating={r.rating} />
                            </div>
                            <p className="mt-1 font-body text-sm leading-relaxed text-chalk/70">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-base text-chalk/60">Aún no hay reseñas para este producto.</p>
                )}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="border-t border-white/10 bg-ink py-20">
          <div className="mx-auto max-w-[1920px] px-4 lg:px-[100px] xl:px-[200px]">
            <h2 className="mb-10 text-center font-display text-4xl uppercase tracking-widest2 text-white sm:text-5xl">Más opciones</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {related.map((p) => {
                const pVariants = normalizeVariants(p)
                const thumb = pVariants[0]?.images?.[0] || p.image
                return (
                  <article key={p.id} onClick={() => openProduct(p.id)}
                    className="group cursor-pointer overflow-hidden bg-plum/30 ring-1 ring-white/10 transition-all duration-500 hover:ring-grape/60">
                    <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                      {thumb ? (
                        <img src={thumb} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-plum/40"><ImageOff size={32} className="text-white/30" /></div>
                      )}
                      {p.stock <= 0 && (
                        <div className="absolute left-0 top-0 bg-red-500/90 px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-white">Agotado</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 p-5">
                      <h3 className="font-display text-xl uppercase tracking-widest2 text-white">{p.name}</h3>
                      <span className="font-display text-lg tracking-wide text-grape">{formatCOP(p.price)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {lightbox !== null && gallery.length > 0 && (
        <Lightbox
          images={gallery}
          index={Math.min(lightbox, gallery.length - 1)}
          alt={`${product.name} ${selectedColor}`}
          onIndex={(i) => { setLightbox(i); showImage(i) }}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
