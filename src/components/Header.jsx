import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, Menu, X, User } from 'lucide-react'
import { useCart } from '../store/cartStore'
import { useUI } from '../store/uiStore'
import { useCustomer } from '../store/customerStore'
import AccountMenu, { Avatar } from './AccountMenu'

const links = [
  { label: 'Inicio', view: 'inicio' },
  { label: 'Colecciones', view: 'colecciones' },
  { label: 'Quiénes Somos', view: 'quienes' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0))
  const openCart = useCart((s) => s.open)
  const view = useUI((s) => s.view)
  const backToStore = useUI((s) => s.backToStore)
  const goAccount = useUI((s) => s.goAccount)
  const customer = useCustomer((s) => s.user)
  const accountOpen = useCustomer((s) => s.menuOpen)
  const toggleMenu = useCustomer((s) => s.toggleMenu)
  const accountButton = useRef(null)
  // Con sesión abierta el ícono abre la ventana pequeña; sin sesión, el ingreso.
  const handleAccount = () => (customer ? toggleMenu() : goAccount())
  const accountLabel = customer ? 'Mi cuenta' : 'Ingresar'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (target) => {
    if (view !== 'store') {
      backToStore()
      setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleLogo = () => {
    if (view !== 'store') {
      backToStore()
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const solidBg = scrolled || view === 'product' || view === 'cuenta'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solidBg ? 'bg-ink/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.6)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-4 lg:px-[100px] xl:px-[200px]">
        <button onClick={handleLogo} className="flex items-center">
          <img
            src="/assets/logo.webp"
            alt="CIENTOVEINTIUNO"
            className="h-12 w-auto object-contain"
          />
        </button>

        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <button
                key={l.view}
                onClick={() => handleNav(l.view)}
                className="relative font-display text-lg uppercase tracking-widest2 text-chalk transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-grape after:transition-all hover:text-white hover:after:w-full"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="relative">
            <button
              ref={accountButton}
              onClick={handleAccount}
              aria-label={accountLabel}
              title={accountLabel}
              aria-expanded={customer ? accountOpen : undefined}
              className={`relative flex rounded-full p-2 transition-colors hover:text-grape ${view === 'cuenta' || accountOpen ? 'text-grape' : 'text-white'}`}
            >
              {customer ? (
                <Avatar user={customer} size={28} className={`ring-2 ${accountOpen ? 'ring-grape' : 'ring-white/20'}`} />
              ) : <User size={24} />}
            </button>
            <AccountMenu anchorRef={accountButton} />
          </div>

          <button
            onClick={openCart}
            aria-label="Abrir carrito"
            className="relative rounded-full p-2 text-white transition-colors hover:text-grape"
          >
            <ShoppingBag size={24} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-grape px-1 font-display text-xs text-white">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="rounded-full p-2 text-white md:hidden"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 animate-fadeIn" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-ink p-6 shadow-2xl animate-slideIn">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-display text-2xl uppercase tracking-widest2 text-white">Menú</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="text-chalk hover:text-white">
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-5">
              {links.map((l) => (
                <button
                  key={l.view}
                  onClick={() => { handleNav(l.view); setMenuOpen(false) }}
                  className="text-left font-display text-2xl uppercase tracking-widest2 text-chalk transition-colors hover:text-grape"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => { handleAccount(); setMenuOpen(false) }}
                className="mt-4 flex items-center gap-3 text-left font-display text-2xl uppercase tracking-widest2 text-chalk transition-colors hover:text-grape"
              >
                <User size={22} /> {accountLabel}
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
