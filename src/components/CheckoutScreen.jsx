import { useEffect, useState } from 'react'
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react'
import { useCart } from '../store/cartStore'
import { useUI } from '../store/uiStore'
import { useCustomer } from '../store/customerStore'
import { formatCOP } from '../data/products'
import { FREE_SHIPPING_FROM, SHIPPING_COST } from '../data/info'
import { createOrder } from '../lib/api'

const field =
  'w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white placeholder:text-chalk/30 focus:border-grape focus:outline-none [color-scheme:dark]'

const DEPARTMENTS = [
  'Bogotá D.C.', 'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
  'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
]

const DRAFT = 'c121-datos-envio'
const readDraft = () => {
  try { return JSON.parse(localStorage.getItem(DRAFT)) || {} } catch { return {} }
}

function Input({ label, id, full, ...props }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="mb-1.5 block font-body text-sm text-chalk/70">{label}</label>
      <input id={id} className={field} {...props} />
    </div>
  )
}

export default function CheckoutScreen() {
  const items = useCart((s) => s.items)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const backToStore = useUI((s) => s.backToStore)
  const user = useCustomer((s) => s.user)
  const [form, setForm] = useState(() => ({
    name: '', email: '', phone: '', docType: 'CC', doc: '',
    department: 'Bogotá D.C.', city: 'Bogotá', address: '', notes: '', ...readDraft(),
  }))
  const [accept, setAccept] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { document.title = 'Pagar · CIENTOVEINTIUNO'; return () => { document.title = 'CIENTOVEINTIUNO' } }, [])
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }))
  }, [user])

  const freeShipping = items.some((i) => i.price > FREE_SHIPPING_FROM)
  const shipping = freeShipping ? 0 : SHIPPING_COST
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    // Los datos de envío (sin el carrito) se recuerdan en este navegador para la próxima compra.
    try { const { notes, ...keep } = form; localStorage.setItem(DRAFT, JSON.stringify(keep)) } catch { /* sin almacenamiento */ }
    try {
      const { checkoutUrl } = await createOrder({
        buyer: form,
        items: items.map((i) => ({ id: i.id, size: i.selectedSize, color: i.selectedColor, qty: i.qty })),
      })
      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="flex flex-col items-center gap-6 px-5 pb-24 pt-40 text-center">
        <ShoppingBag size={48} className="text-white/20" />
        <h1 className="section-title">Tu carrito está vacío</h1>
        <button onClick={backToStore} className="btn-primary">Ver la tienda</button>
      </section>
    )
  }

  return (
    <section className="px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <button onClick={backToStore} className="flex items-center gap-2 font-body text-sm text-chalk/60 transition-colors hover:text-grape">
          <ArrowLeft size={16} /> Seguir comprando
        </button>
        <h1 className="section-title mt-6">Finalizar compra</h1>

        <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <fieldset>
              <legend className="font-display text-2xl uppercase tracking-widest2 text-white">Tus datos</legend>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input label="Nombre completo" id="co-nombre" full required maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} />
                <Input label="Correo" id="co-correo" type="email" required maxLength={160} autoComplete="email" value={form.email} onChange={set('email')} />
                <Input label="Celular" id="co-celular" type="tel" required pattern="[0-9 +()\-]{7,20}" autoComplete="tel" value={form.phone} onChange={set('phone')} />
                <div>
                  <label htmlFor="co-tipo" className="mb-1.5 block font-body text-sm text-chalk/70">Tipo de documento</label>
                  <select id="co-tipo" className={field} value={form.docType} onChange={set('docType')}>
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="CE">Cédula de extranjería</option>
                    <option value="TI">Tarjeta de identidad</option>
                    <option value="PP">Pasaporte</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
                <Input label="Número de documento" id="co-doc" required pattern="[0-9A-Za-z.\-]{4,20}" value={form.doc} onChange={set('doc')} />
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-display text-2xl uppercase tracking-widest2 text-white">Dirección de envío</legend>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-depto" className="mb-1.5 block font-body text-sm text-chalk/70">Departamento</label>
                  <select id="co-depto" className={field} value={form.department} onChange={set('department')}>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <Input label="Ciudad o municipio" id="co-ciudad" required maxLength={80} autoComplete="address-level2" value={form.city} onChange={set('city')} />
                <Input label="Dirección (con barrio, apto o casa)" id="co-dir" full required maxLength={200} autoComplete="street-address" value={form.address} onChange={set('address')} />
                <div className="sm:col-span-2">
                  <label htmlFor="co-notas" className="mb-1.5 block font-body text-sm text-chalk/70">Notas para la entrega (opcional)</label>
                  <textarea id="co-notas" rows={2} maxLength={300} className={field} value={form.notes} onChange={set('notes')} />
                </div>
              </div>
            </fieldset>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="border border-white/10 bg-plum/20 p-6">
              <h2 className="font-display text-2xl uppercase tracking-widest2 text-white">Tu pedido</h2>
              <ul className="mt-5 space-y-4">
                {items.map((i) => (
                  <li key={i.lineId} className="flex gap-3">
                    <img src={i.image} alt={i.name} className="h-16 w-14 flex-shrink-0 object-cover ring-1 ring-white/10" />
                    <div className="flex-1 font-body text-sm">
                      <p className="font-display text-base uppercase tracking-wide text-white">{i.name}</p>
                      <p className="text-chalk/60">{i.selectedColor} · Talla {i.selectedSize} · x{i.qty}</p>
                    </div>
                    <span className="font-display text-lg text-white">{formatCOP(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 space-y-2 border-t border-white/10 pt-4 font-body text-sm">
                <div className="flex justify-between text-chalk/70"><dt>Subtotal</dt><dd>{formatCOP(subtotal)}</dd></div>
                <div className="flex justify-between text-chalk/70">
                  <dt>Envío</dt><dd className={freeShipping ? 'text-emerald-400' : ''}>{freeShipping ? 'Gratis' : formatCOP(shipping)}</dd>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="font-display text-xl uppercase tracking-widest2 text-white">Total</dt>
                  <dd className="font-display text-3xl text-white">{formatCOP(subtotal + shipping)}</dd>
                </div>
              </dl>

              <label className="mt-6 flex gap-3 font-body text-xs leading-relaxed text-chalk/70">
                <input type="checkbox" required checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-grape" />
                <span>
                  Acepto los <a href="#/info/terminos" target="_blank" className="text-grape hover:underline">términos y condiciones</a> y
                  la <a href="#/info/privacidad" target="_blank" className="text-grape hover:underline">política de privacidad</a>.
                </span>
              </label>

              {error && <p role="alert" className="mt-4 border border-red-500/40 bg-red-500/10 px-3 py-2 font-body text-sm text-red-300">{error}</p>}

              <button type="submit" disabled={sending} className="btn-primary mt-6 w-full disabled:opacity-60 disabled:hover:scale-100">
                <Lock size={18} /> {sending ? 'Abriendo el pago...' : 'Pagar con Wompi'}
              </button>
              <p className="mt-3 text-center font-body text-xs text-chalk/50">
                Te llevaremos a Wompi (Bancolombia) para pagar con tarjeta, PSE, Nequi o Bancolombia.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  )
}
