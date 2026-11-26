import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

const ZOOM = 2.2

// Galería a pantalla completa: flechas, teclado, deslizar con el dedo y
// zoom al tocar la foto (con el zoom puesto, la foto sigue al cursor o al dedo).
export default function Lightbox({ images, index, alt, onIndex, onClose }) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const touch = useRef(null)
  const closeRef = useRef(null)
  const count = images.length

  const go = (step) => {
    if (count < 2) return
    setZoomed(false)
    onIndex((index + step + count) % count)
  }

  // Teclado y bloqueo del scroll de la página mientras está abierta.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = prev }
  }, [])

  const pointAt = (clientX, clientY, el) => {
    const r = el.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100))
    setOrigin(`${x}% ${y}%`)
  }

  const toggleZoom = (e) => {
    e.stopPropagation()
    if (!zoomed) pointAt(e.clientX, e.clientY, e.currentTarget)
    setZoomed((z) => !z)
  }

  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY, moved: false }
  }
  const onTouchMove = (e) => {
    const t = e.touches[0]
    if (!touch.current) return
    touch.current.moved = true
    if (zoomed) pointAt(t.clientX, t.clientY, e.currentTarget)
  }
  const onTouchEnd = (e) => {
    const start = touch.current
    touch.current = null
    if (!start || zoomed || !start.moved) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${alt}`}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex animate-fadeIn flex-col bg-ink/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-8" onClick={(e) => e.stopPropagation()}>
        <span className="font-display text-lg uppercase tracking-widest2 text-chalk/70">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? 'Alejar' : 'Acercar'}
            className="flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-grape"
          >
            {zoomed ? <ZoomOut size={22} /> : <ZoomIn size={22} />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar galería"
            className="flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-grape"
          >
            <X size={26} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20">
        <div
          onClick={toggleZoom}
          onMouseMove={(e) => zoomed && pointAt(e.clientX, e.clientY, e.currentTarget)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`relative h-full max-h-full overflow-hidden ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          style={{ touchAction: zoomed ? 'none' : 'pan-y' }}
        >
          <img
            key={images[index]}
            src={images[index]}
            alt={`${alt} · foto ${index + 1}`}
            draggable={false}
            className="h-full max-h-full w-auto max-w-full animate-fadeIn select-none object-contain transition-transform duration-300 ease-out"
            style={{ transform: zoomed ? `scale(${ZOOM})` : 'none', transformOrigin: origin }}
          />
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center bg-white/5 text-white ring-1 ring-white/10 transition-all hover:bg-grape hover:ring-grape sm:left-6 sm:flex"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1) }}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center bg-white/5 text-white ring-1 ring-white/10 transition-all hover:bg-grape hover:ring-grape sm:right-6 sm:flex"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-3 px-4 py-5" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => { setZoomed(false); onIndex(i) }}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-16 w-14 overflow-hidden ring-2 transition-all ${
                i === index ? 'ring-grape' : 'opacity-50 ring-white/10 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="pb-4 text-center font-body text-xs text-chalk/40 sm:hidden">
        Desliza para cambiar · toca para acercar
      </p>
    </div>
  )
}
