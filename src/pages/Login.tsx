import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

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

  const input = 'min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-3xl">💸</div>
        <h1 className="text-3xl font-bold">Mis Gastos</h1>
        <p className="mt-1 text-sm text-slate-500">Controlá tus gastos en pesos y dólares</p>
      </div>

      <div className="mb-4 flex rounded-full bg-slate-200 p-1 dark:bg-slate-800" role="tablist">
        {(['in', 'up'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setError(null); setInfo(null) }}
            className={`min-h-[44px] flex-1 rounded-full text-sm font-semibold ${mode === m ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500'}`}
          >
            {m === 'in' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        <input type="password" required minLength={mode === 'up' ? 6 : undefined} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Contraseña" value={pw} onChange={(e) => setPw(e.target.value)} className={input} />
        {error && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
        {info && <p className="rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{info}</p>}
        <button type="submit" disabled={busy} className="min-h-[48px] w-full rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-60">
          {busy ? 'Un momento…' : mode === 'in' ? 'Ingresar' : 'Crear cuenta'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />o<span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
      </div>

      <button type="button" onClick={google} className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white font-semibold dark:border-slate-700 dark:bg-slate-900">
        Continuar con Google
      </button>
    </div>
  )
}
