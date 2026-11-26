import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useUI } from '../store/uiStore'
import { useCart } from '../store/cartStore'
import { formatCOP } from '../data/products'
import { CONTACT } from '../data/info'
import { getOrder } from '../lib/api'

const VIEW = {
  APPROVED: { icon: CheckCircle2, color: 'text-emerald-400', title: '¡Pago aprobado!', text: 'Gracias por tu compra. Ya estamos preparando tu pedido; te escribiremos para coordinar el envío.' },
  PENDING: { icon: Clock, color: 'text-amber-300', title: 'Pago en proceso', text: 'Estamos esperando la confirmación de Wompi. Esto puede tardar unos minutos (con PSE a veces un poco más).' },
  DECLINED: { icon: XCircle, color: 'text-red-400', title: 'Pago rechazado', text: 'El pago no fue aprobado y no se hizo ningún cobro. Tu carrito sigue guardado para que lo intentes de nuevo.' },
}
VIEW.VOIDED = VIEW.DECLINED
VIEW.ERROR = { ...VIEW.DECLINED, title: 'Hubo un error con el pago' }

export default function OrderStatus() {
  const { ref, txId } = useUI((s) => s.order) || {}
  const goCheckout = useUI((s) => s.goCheckout)
  const clearCart = useCart((s) => s.clear)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stop = false
    let tries = 0
    const load = async () => {
      try {
        const o = await getOrder(ref, txId)
        if (stop) return
        setOrder(o)
        if (o.status === 'APPROVED') clearCart()
        if (o.status === 'PENDING' && ++tries < 40) setTimeout(load, 4000)
      } catch (err) {
        if (!stop) setError(err.message)
      }
    }
    load()
    return () => { stop = true }
  }, [ref, txId, clearCart])

  const goHome = () => { window.location.assign('/') }
  const v = order ? VIEW[order.status] || VIEW.PENDING : null

  return (
    <section className="px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <div className="mx-auto max-w-2xl text-center">
        {error ? (
          <>
            <h1 className="section-title">Pedido no encontrado</h1>
            <p className="mt-4 font-body text-chalk/70">{error}</p>
          </>
        ) : !order ? (
          <p className="font-display text-2xl uppercase tracking-widest2 text-chalk/50">Consultando tu pago...</p>
        ) : (
          <>
            <v.icon size={64} className={`mx-auto ${v.color}`} />
            <h1 className="section-title mt-6">{v.title}</h1>
            <p className="mt-4 font-body text-lg text-chalk/80">{v.text}</p>
            <p className="mt-6 font-body text-sm text-chalk/50">
              Referencia: <span className="font-mono text-white">{order.reference}</span>
            </p>

            <div className="mt-10 border border-white/10 bg-plum/20 p-6 text-left">
              <ul className="space-y-2 font-body text-sm">
                {order.items.map((i, n) => (
                  <li key={n} className="flex justify-between gap-4 text-chalk/80">
                    <span>{i.name} · {i.color} · Talla {i.size} · x{i.qty}</span>
                    <span className="text-white">{formatCOP(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-white/10 pt-4 font-body text-sm text-chalk/70">
                <div className="flex justify-between"><span>Envío</span><span>{order.shippingOnDelivery ? 'Contra entrega' : order.shipping ? formatCOP(order.shipping) : 'Gratis'}</span></div>
                <div className="flex justify-between font-display text-xl uppercase tracking-widest2 text-white"><span>Total</span><span>{formatCOP(order.total)}</span></div>
              </div>
            </div>
          </>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {order && ['DECLINED', 'VOIDED', 'ERROR'].includes(order.status) && (
            <button onClick={() => { window.history.replaceState(null, '', '/'); goCheckout() }} className="btn-primary">Intentar de nuevo</button>
          )}
          <button onClick={goHome} className="btn-ghost">Volver a la tienda</button>
        </div>
        <p className="mt-8 font-body text-xs text-chalk/50">
          ¿Dudas con tu pedido? Escríbenos al WhatsApp{' '}
          <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-grape hover:underline">{CONTACT.whatsappLabel}</a>{' '}
          con tu referencia.
        </p>
      </div>
    </section>
  )
}
