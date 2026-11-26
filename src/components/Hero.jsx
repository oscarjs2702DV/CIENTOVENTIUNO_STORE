import { ArrowDown } from 'lucide-react'

const heroBg = '/assets/hero.webp'

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex h-screen min-h-[640px] flex-col items-center justify-center overflow-hidden text-center"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/60 to-ink" />
      <div className="absolute inset-0 bg-ink/40" />

      <div className="absolute left-1/2 top-1/2 z-10 flex w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center px-4 text-center">
          {/* El tamaño crece con el ancho de pantalla para que la palabra nunca se salga.
              El margen negativo compensa el espacio que deja la última letra. */}
          <h1 className="mr-[-0.25em] whitespace-nowrap opacity-0 font-display text-[clamp(1.75rem,9.8vw,7.75rem)] uppercase leading-none tracking-widest3 text-white animate-riseUp [animation-delay:0.2s]">
            CIENTOVEINTIUNO
          </h1>

          <p className="mt-8 font-script text-2xl leading-snug text-chalk opacity-0 animate-riseUp [animation-delay:0.6s] sm:text-3xl md:text-4xl">
            Viste con propósito, camina con gracia
            <br className="hidden sm:block" /> y transforma tus prendas en un
            testimonio
          </p>

          <div className="mt-12 opacity-0 animate-riseUp [animation-delay:1s]">
            <a href="#colecciones" className="btn-primary">
              Explorar Colección
            </a>
          </div>
      </div>

      <a
        href="#colecciones"
        aria-label="Bajar"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/60 transition-colors hover:text-grape"
      >
        <ArrowDown className="animate-bounce" size={26} />
      </a>
    </section>
  )
}
