import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Wallet } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button, Icon, Segmented } from '../components/ui'

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setInfo(null); setBusy(true)
    const err = mode === 'in' ? await signIn(email.trim(), pw) : await signUp(email.trim(), pw)
    setBusy(false)
    if (err) setError(err)
    else if (mode === 'up') setInfo('Cuenta creada. Si te pedimos confirmar el mail, revisá tu casilla.')
  }

  const google = async () => {
    setError(null)
    const err = await signInWithGoogle()
    if (err) setError(err)
  }

  const input = 'h-12 w-full rounded-control border border-line-strong bg-surface px-4 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-accent'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-control bg-accent text-on-accent"><Icon icon={Wallet} size={20} /></span>
          <span className="text-[18px] leading-none font-medium">Mis Gastos</span>
        </div>
        <h1 className="text-[28px] leading-8 font-medium tracking-[-0.01em]">Tus gastos en pesos y dólares</h1>
        <p className="mt-2 text-[15px] text-fg-2">Cada movimiento con su equivalente al dólar blue del día</p>
      </div>

      <Segmented
        label="Modo"
        className="mb-4"
        value={mode}
        onChange={(m) => { setMode(m); setError(null); setInfo(null) }}
        options={[{ value: 'in', label: 'Ingresar' }, { value: 'up', label: 'Crear cuenta' }]}
      />

      <form onSubmit={submit} className="space-y-3">
        <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        <input type="password" required minLength={mode === 'up' ? 6 : undefined} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Contraseña" value={pw} onChange={(e) => setPw(e.target.value)} className={input} />
        {error && <p className="rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-neg" role="alert">{error}</p>}
        {info && <p className="rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-fg-2">{info}</p>}
        <Button type="submit" block disabled={busy} className="h-12">
          {busy ? 'Un momento…' : mode === 'in' ? 'Ingresar' : 'Crear cuenta'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[13px] text-fg-3">
        <span className="h-px flex-1 bg-line-strong" />o<span className="h-px flex-1 bg-line-strong" />
      </div>

      <Button type="button" variant="secondary" block onClick={google} className="h-12">
        <Icon icon={LogIn} />
        Continuar con Google
      </Button>

      <Link to="/privacidad" className="mt-6 inline-flex min-h-[44px] items-center justify-center text-[13px] text-fg-3 underline transition-colors hover:text-fg-2">
        Política de privacidad
      </Link>
    </div>
  )
}
