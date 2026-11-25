import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, X } from 'lucide-react'
import { ageFrom, useCustomer } from '../store/customerStore'
import { useToast } from '../store/toastStore'
import { Avatar } from './AccountMenu'

const field =
  'w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white placeholder:text-chalk/30 focus:border-grape focus:outline-none [color-scheme:dark]'

// Recorta al centro y reduce la foto a 256×256 antes de subirla.
function squareAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 256
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo leer la foto'))), 'image/webp', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Ese archivo no es una imagen válida')) }
    img.src = url
  })
}

const today = new Date()
const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()).toISOString().slice(0, 10)

export default function ProfileDialog() {
  const { user, profileOpen, closeProfile, saveProfile, setAvatar, deleteAvatar } = useCustomer()
  const toast = useToast()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null) // 'guardar' | 'foto'
  const fileInput = useRef(null)

  useEffect(() => {
    if (!profileOpen || !user) return
    setName(user.name || '')
    setBirthDate(user.birthDate || '')
    setError(null)
    const onKey = (e) => { if (e.key === 'Escape') closeProfile() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [profileOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!profileOpen || !user) return null
  const age = ageFrom(birthDate)

  const run = async (kind, fn, done) => {
    setError(null)
    setBusy(kind)
    try {
      await fn()
      if (done) toast.success(done)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) run('foto', async () => setAvatar(await squareAvatar(file)), 'Foto actualizada')
  }

  const submit = (e) => {
    e.preventDefault()
    run('guardar', async () => {
      await saveProfile({ name, birthDate: birthDate || null })
      closeProfile()
    }, 'Perfil guardado')
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 animate-fadeIn" onClick={closeProfile} />
      <div role="dialog" aria-modal="true" aria-labelledby="perfil-titulo"
        className="relative w-full max-w-md border border-white/10 bg-ink p-6 shadow-2xl animate-fadeIn">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="perfil-titulo" className="font-display text-2xl uppercase tracking-widest2 text-white">Mi perfil</h2>
          <button onClick={closeProfile} aria-label="Cerrar" className="text-chalk/60 hover:text-white"><X size={22} /></button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar user={user} size={84} />
          <div className="flex flex-col items-start gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} disabled={busy === 'foto'}
              className="flex items-center gap-2 font-body text-sm text-grape hover:text-white disabled:opacity-50">
              <Camera size={16} /> {busy === 'foto' ? 'Subiendo...' : user.avatar ? 'Cambiar foto' : 'Añadir foto'}
            </button>
            {user.avatar && (
              <button type="button" disabled={busy === 'foto'}
                onClick={() => run('foto', deleteAvatar, 'Foto quitada')}
                className="flex items-center gap-2 font-body text-sm text-chalk/50 hover:text-red-300 disabled:opacity-50">
                <Trash2 size={16} /> Quitar foto
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="perfil-nombre" className="mb-1.5 block font-body text-sm text-chalk/70">Nombre</label>
            <input id="perfil-nombre" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-sm text-chalk/70">Correo</label>
            <p className="border border-white/5 px-3 py-2.5 font-body text-chalk/50">{user.email}</p>
          </div>
          <div>
            <label htmlFor="perfil-nacimiento" className="mb-1.5 block font-body text-sm text-chalk/70">
              Fecha de nacimiento {age != null && age >= 0 && <span className="text-grape">· {age} años</span>}
            </label>
            <input id="perfil-nacimiento" type="date" min="1915-01-01" max={maxDate}
              value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={field} />
            <p className="mt-1.5 font-body text-xs text-chalk/40">
              Con tu edad te sugerimos prendas que te puedan gustar. Solo tú la ves.
            </p>
          </div>
          {error && <p role="alert" className="font-body text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={busy === 'guardar'} className="btn-primary mt-2 w-full disabled:opacity-50">
            {busy === 'guardar' ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
