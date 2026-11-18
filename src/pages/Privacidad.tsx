import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, privacyPolicy } from '../content/legal'

export default function Privacidad() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-6 text-slate-900 dark:text-slate-100">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-700 dark:text-teal-400">← Volver a la app</Link>
      <h1 className="mt-2 text-2xl font-bold">{privacyPolicy.title}</h1>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{privacyPolicy.updated}</p>
      <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">{privacyPolicy.intro}</p>
      {privacyPolicy.sections.map((s) => (
        <section key={s.heading} className="mt-6">
          <h2 className="text-lg font-semibold">{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="mt-2 leading-relaxed text-slate-700 dark:text-slate-300">{p}</p>
          ))}
        </section>
      ))}
      <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
        Contacto: <a className="font-medium text-teal-700 underline dark:text-teal-400" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p className="mt-2 text-sm">
        <Link to="/eliminar-cuenta" className="text-teal-700 underline dark:text-teal-400">Cómo eliminar tu cuenta</Link>
      </p>
    </main>
  )
}
