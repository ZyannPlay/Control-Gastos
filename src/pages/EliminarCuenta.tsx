import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Icon } from '../components/ui/Icon'
import { CONTACT_EMAIL, deleteAccountInfo } from '../content/legal'

const btn = 'mt-4 flex h-11 items-center justify-center rounded-control px-4 text-[15px] font-medium transition-[background-color,opacity,transform] duration-150 ease-soft active:scale-[0.98]'

export default function EliminarCuenta({ user }: { user: boolean }) {
  const list = 'mt-2 list-inside list-decimal space-y-1 text-[15px] leading-6 text-fg-2'
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-6 text-fg">
      <Link to="/" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-[15px] text-accent-ink transition-colors hover:text-fg">
        <Icon icon={ChevronLeft} />Volver a la app
      </Link>
      <h1 className="mt-4 text-[28px] leading-8 font-medium tracking-[-0.01em]">{deleteAccountInfo.title}</h1>
      <p className="mt-6 text-[15px] leading-6 text-fg-2">{deleteAccountInfo.intro}</p>

      <section className="mt-8">
        <h2 className="text-[17px] leading-6 font-medium">Desde la app</h2>
        <ol className={list}>{deleteAccountInfo.inAppSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {user ? (
          <Link to="/ajustes" className={`${btn} bg-accent text-on-accent hover:opacity-90`}>
            Ir a Ajustes para eliminar mi cuenta
          </Link>
        ) : (
          <p className="mt-3 text-[13px] leading-5 text-fg-3">Iniciá sesión en la app para eliminar tu cuenta desde Ajustes</p>
        )}
      </section>

      {!user && (
        <section className="mt-8">
          <h2 className="text-[17px] leading-6 font-medium">Si no podés ingresar</h2>
          <ol className={list}>{deleteAccountInfo.requestSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20mi%20cuenta`} className={`${btn} border border-line-strong bg-surface hover:bg-raised`}>
            Escribir a {CONTACT_EMAIL}
          </a>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[17px] leading-6 font-medium">Qué datos se eliminan</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-[15px] leading-6 text-fg-2">
          {deleteAccountInfo.dataDeleted.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <p className="mt-3 text-[15px] leading-6 text-fg-2">{deleteAccountInfo.retention}</p>
      </section>

      <p className="mt-8 text-[13px] leading-5 text-fg-3">
        Contacto: <a className="text-accent-ink underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  )
}
