import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Icon } from '../components/ui/Icon'
import { CONTACT_EMAIL, privacyPolicy } from '../content/legal'

export default function Privacidad() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-6 text-fg">
      <Link to="/" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-[15px] text-accent-ink transition-colors hover:text-fg">
        <Icon icon={ChevronLeft} />Volver a la app
      </Link>
      <h1 className="mt-4 text-[28px] leading-8 font-medium tracking-[-0.01em]">{privacyPolicy.title}</h1>
      <p className="mt-2 font-mono text-[12px] leading-4 text-fg-3">{privacyPolicy.updated}</p>
      <p className="mt-6 text-[15px] leading-6 text-fg-2">{privacyPolicy.intro}</p>
      {privacyPolicy.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="text-[17px] leading-6 font-medium">{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="mt-2 text-[15px] leading-6 text-fg-2">{p}</p>
          ))}
        </section>
      ))}
      <p className="mt-8 text-[13px] leading-5 text-fg-3">
        Contacto: <a className="text-accent-ink underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p className="mt-2 text-[13px] leading-5">
        <Link to="/eliminar-cuenta" className="text-accent-ink underline">Cómo eliminar tu cuenta</Link>
      </p>
    </main>
  )
}
