import { Instagram, Mail, MapPin, MessageCircle } from 'lucide-react'
import { CONTACT, FOOTER_LINKS } from '../data/info'

const linkCls = 'font-body text-sm text-chalk/60 transition-colors hover:text-grape'

const cols = [
  { title: 'Tienda', links: FOOTER_LINKS.tienda },
  { title: 'Legal', links: FOOTER_LINKS.legal },
]

const contact = [
  { icon: MapPin, label: CONTACT.place, href: 'https://www.google.com/maps/search/?api=1&query=La+Caba%C3%B1a%2C+Fontib%C3%B3n%2C+Bogot%C3%A1' },
  { icon: Mail, label: CONTACT.email, href: `mailto:${CONTACT.email}` },
  CONTACT.whatsapp && { icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/${CONTACT.whatsapp}` },
].filter(Boolean)

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <span className="font-display text-3xl uppercase tracking-widest3 text-white">
              CientoVeintiuno
            </span>
            <p className="mt-4 font-script text-2xl text-grape">
              Viste con propósito
            </p>
            <p className="mt-3 font-body text-sm text-chalk/60">
              Ropa urbana con propósito, hecha en Fontibón, Bogotá.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-lg uppercase tracking-widest2 text-white">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2">
                {c.links.map(([slug, label]) => (
                  <li key={slug}>
                    <a href={`#/info/${slug}`} className={linkCls}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-display text-lg uppercase tracking-widest2 text-white">Contacto</h4>
            <ul className="mt-4 space-y-3">
              {contact.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={`flex items-start gap-2 break-words ${linkCls}`}
                  >
                    <Icon size={16} className="mt-0.5 flex-shrink-0 text-grape" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
          <p className="font-body text-xs text-chalk/50">
            © {new Date().getFullYear()} CIENTOVEINTIUNO. Todos los derechos
            reservados.
          </p>
          <div className="flex items-center gap-5">
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de CIENTOVEINTIUNO"
              className="flex items-center gap-2 font-body text-sm text-chalk/60 transition-colors hover:text-grape"
            >
              <Instagram size={20} />
              {CONTACT.instagramUser}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
