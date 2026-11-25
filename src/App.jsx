import { useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Collections from './components/Collections'
import About from './components/About'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProductDetail from './components/ProductDetail'
import AuthScreen from './components/AuthScreen'
import AdminDashboard from './components/AdminDashboard'
import ToastContainer from './components/ToastContainer'
import { useUI } from './store/uiStore'
import { useAuth } from './store/authStore'

const ADMIN_EMAIL = 'estebarin123@gmail.com'

export default function App() {
  const view = useUI((s) => s.view)
  const { init, user, loading } = useAuth()
  const needsAuth = view === 'admin' || view === 'login'

  useEffect(() => { if (needsAuth) init() }, [needsAuth, init])

  if (needsAuth && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="font-display text-2xl uppercase tracking-widest2 text-chalk/50">Cargando...</p>
      </div>
    )
  }

  // Admin gets its own standalone layout — no store header/footer/cart.
  // The server checks the session on every write; this only picks the screen.
  if (needsAuth) {
    return (
      <>
        {user ? <AdminDashboard /> : <AuthScreen />}
        <ToastContainer />
      </>
    )
  }

  // Store layout: header + content + footer + cart
  let content
  if (view === 'product') {
    content = <ProductDetail />
  } else {
    content = (
      <>
        <Hero />
        <Collections />
        <About />
      </>
    )
  }

  return (
    <>
      <Header />
      <main>{content}</main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </>
  )
}
