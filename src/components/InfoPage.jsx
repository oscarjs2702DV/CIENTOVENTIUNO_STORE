import { useEffect } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PAGES, FOOTER_LINKS, CONTACT } from '../data/info'
import { useUI } from '../store/uiStore'

function Block({ b }) {
  if (typeof b === 'string') return <p>{b}</p>
  return (
    <ul className="space-y-2">
      {b.list.map((li) => (
        <li key={li} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 bg-grape" />
          <span>{li}</span>
        </li>
      ))}
    </ul>
  )
}

export default function InfoPage() {
  const slug = useUI((s) => s.infoSlug)
  const backToStore = useUI((s) => s.backToStore)
  const openProduct = useUI((s) => s.openProduct)
  const page = PAGES[slug]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (page) document.title = `${page.title} · CIENTOVENTIUNO`
    return () => { document.title = 'CIENTOVENTIUNO' }
  }, [slug, page])

  if (!page) {
    return (
      <section className="px-5 pb-24 pt-36 text-center">
        <h1 className="section-title">Página no encontrada</h1>
        <button onClick={backToStore} className="mt-8 font-display text-lg uppercase tracking-widest2 text-grape">
          Volver a la tienda
        </button>
      </section>
    )
  }

  const group = FOOTER_LINKS.legal.some(([s]) => s === slug) ? FOOTER_LINKS.legal : FOOTER_LINKS.tienda

  return (
    <section className="px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <button
            onClick={backToStore}
            className="flex items-center gap-2 font-body text-sm text-chalk/60 transition-colors hover:text-grape"
          >
            <ArrowLeft size={16} /> Volver a la tienda
          </button>
          <nav className="mt-8 flex gap-x-5 gap-y-3 overflow-x-auto lg:flex-col">
            {group.map(([s, label]) => (
              <a
                key={s}
                href={`#/info/${s}`}
                aria-current={s === slug ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 pb-1 font-display text-lg uppercase tracking-widest2 transition-colors lg:border-b-0 lg:border-l-2 lg:pb-0 lg:pl-4 ${
                  s === slug ? 'border-grape text-white' : 'border-transparent text-chalk/50 hover:text-white'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="max-w-3xl">
          <span className="font-script text-3xl text-grape">{page.kicker}</span>
          <h1 className="section-title mt-2">{page.title}</h1>
          {page.updated && (
            <p className="mt-3 font-body text-xs uppercase tracking-widest2 text-chalk/40">
              Última actualización: {page.updated}
            </p>
          )}
          <p className="mt-6 font-body text-lg leading-relaxed text-chalk/85">{page.intro}</p>

          {page.highlight && (
            <div className="mt-8 border-l-4 border-grape bg-plum/30 px-6 py-5">
              <p className="font-display text-xl uppercase tracking-widest2 text-white">{page.highlight}</p>
            </div>
          )}

          <div className="mt-12 space-y-12">
            {page.sections.map((s) => (
              <div key={s.h} className={s.date ? 'border-t border-white/10 pt-8' : ''}>
                {s.date && (
                  <span className="font-body text-xs uppercase tracking-widest2 text-grape">{s.date}</span>
                )}
                <h2 className="mt-1 font-display text-2xl uppercase tracking-widest2 text-white md:text-3xl">{s.h}</h2>
                <div className="mt-4 space-y-4 font-body leading-relaxed text-chalk/75">
                  {s.body.map((b, i) => <Block key={i} b={b} />)}
                </div>
                {s.product && (
                  <button
                    onClick={() => openProduct(s.product.id)}
                    className="mt-6 inline-flex items-center gap-2 bg-grape px-5 py-3 font-display text-lg uppercase tracking-widest2 text-white transition-colors hover:bg-grape/80"
                  >
                    {s.product.label} <ArrowRight size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 border border-white/10 bg-plum/20 px-6 py-6">
            <p className="font-display text-xl uppercase tracking-widest2 text-white">¿Te quedó alguna duda?</p>
            <p className="mt-2 font-body text-sm text-chalk/70">
              Escríbenos a{' '}
              <a href={`mailto:${CONTACT.email}`} className="text-grape hover:underline">{CONTACT.email}</a>, al WhatsApp{' '}
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-grape hover:underline">
                {CONTACT.whatsappLabel}
              </a>{' '}
              o por Instagram en{' '}
              <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="text-grape hover:underline">
                {CONTACT.instagramUser}
              </a>
              .
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
