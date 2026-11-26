import { useState, useEffect } from 'react'
import { ImageOff, Eye, ArrowRight } from 'lucide-react'
import { listProducts } from '../lib/api'
import { formatCOP } from '../data/products'
import { normalizeVariants } from '../lib/variants'
import { useUI } from '../store/uiStore'
import Reveal from './Reveal'
import { isLowStock } from '../lib/stock'

function ProductCard({ product }) {
  const openProduct = useUI((s) => s.openProduct)
  const variants = normalizeVariants(product)
  const agotado = product.stock <= 0
  const pocas = isLowStock(product)
  const hasColors = variants.length > 1

  const [active, setActive] = useState(0)      // color elegido con clic
  const [preview, setPreview] = useState(null) // color bajo el cursor
  const [seen, setSeen] = useState([0])        // colores cuya foto ya se pidió
  const [loaded, setLoaded] = useState({})
  const [failed, setFailed] = useState({})
  const [visible, setVisible] = useState(0)    // color que se ve en la foto

  const wanted = preview ?? active

  // La foto cambia solo cuando la nueva ya cargó, para que no parpadee.
  useEffect(() => {
    if (loaded[wanted] || failed[wanted]) setVisible(wanted)
  }, [wanted, loaded, failed])

  const look = (i) => {
    setPreview(i)
    setSeen((s) => (s.includes(i) ? s : [...s, i]))
  }
  const pick = (e, i) => {
    e.stopPropagation()
    setActive(i)
    look(i)
  }

  const shown = variants[visible] || variants[0]
  const second = shown.images[1]
  const broken = failed[visible] || !shown.images[0]

  return (
    <article
      onClick={() => openProduct(product.id, wanted)}
      className="group relative flex flex-1 cursor-pointer flex-col overflow-hidden bg-plum/30 ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:ring-grape/60 hover:shadow-[0_18px_40px_-18px_rgba(138,43,226,0.55)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink">
        {broken ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-plum/40">
            <ImageOff size={40} className="text-white/30" />
            <span className="font-display text-xl uppercase tracking-widest2 text-white/40">
              CIENTOVEINTIUNO
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
            {seen.map((i) => variants[i]?.images[0] && (
              <img
                key={i}
                src={variants[i].images[0]}
                alt={i === visible ? `${product.name} ${variants[i].colorName}` : ''}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded((l) => ({ ...l, [i]: true }))}
                onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === visible ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            {/* Segunda foto del mismo color: aparece al pasar el cursor. */}
            {second && (
              <img
                key={`second-${visible}`}
                src={second}
                alt=""
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ${preview === null ? 'group-hover:opacity-100' : ''}`}
              />
            )}
          </div>
        )}
        {agotado && (
          <div className="absolute left-0 top-0 z-10 bg-red-500/90 px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-white">
            Agotado
          </div>
        )}
        {pocas && (
          <div className="absolute left-0 top-0 z-10 flex items-center gap-2 bg-grape px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            {product.stock === 1 ? 'Última unidad' : `Últimas ${product.stock}`}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-end justify-center bg-gradient-to-t from-ink/85 to-transparent pb-4 pt-12 transition-transform duration-500 ease-out group-hover:translate-y-0">
          <span className="flex items-center gap-2 font-display text-lg uppercase tracking-widest2 text-white">
            <Eye size={20} />
            Ver detalle
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-2xl uppercase tracking-widest2 text-white">
          {product.name}
        </h3>

        {hasColors && (
          <div onMouseLeave={() => setPreview(null)} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {variants.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => pick(e, i)}
                  onMouseEnter={() => look(i)}
                  onFocus={() => look(i)}
                  onBlur={() => setPreview(null)}
                  aria-label={`Color ${v.colorName}`}
                  aria-pressed={active === i}
                  title={v.colorName}
                  style={{ backgroundColor: v.color }}
                  className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-[#1a0d2b] transition-transform duration-200 hover:scale-125 focus:outline-none focus-visible:scale-125 ${
                    wanted === i ? 'ring-grape' : 'ring-white/15'
                  }`}
                />
              ))}
            </div>
            <span className="font-body text-xs uppercase tracking-widest2 text-chalk/60">
              {variants.length} colores · <span className="text-white">{variants[wanted]?.colorName}</span>
            </span>
          </div>
        )}

        <p className="font-body text-sm leading-relaxed text-chalk/80">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-2xl tracking-wide text-white">
            {formatCOP(product.price)}
          </span>
          <span className={`flex items-center gap-2 px-4 py-2 font-display text-base uppercase tracking-widest2 text-white transition-all duration-300 ${
            agotado
              ? 'bg-white/10 text-white/40'
              : 'bg-grape group-hover:scale-110 group-hover:bg-grapeDark group-hover:shadow-[0_6px_24px_rgba(138,43,226,0.45)]'
          }`}>
            {agotado ? 'Agotado' : 'Ver'}
            {!agotado && <ArrowRight size={18} />}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function Collections() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="colecciones" className="bg-ink px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 text-center">
          <span className="font-script text-3xl text-grape">Colecciones</span>
          <h2 className="section-title mt-2">La Tienda</h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-chalk/70">
            Piezas diseñadas en Bogotá. Ediciones limitadas, cortes oversize y
            tejidos premium.
          </p>
        </Reveal>

        {loading ? (
          <div className="py-20 text-center font-display text-2xl uppercase tracking-widest2 text-chalk/50">
            Cargando productos...
          </div>
        ) : error || products.length === 0 ? (
          <div className="py-20 text-center font-body text-chalk/60">
            {error ? 'No pudimos cargar los productos. Recarga la página.' : 'Pronto habrá nuevos productos.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 110} className="flex">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
