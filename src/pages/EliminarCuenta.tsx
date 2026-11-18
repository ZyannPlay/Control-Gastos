import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, deleteAccountInfo } from '../content/legal'

export default function EliminarCuenta({ user }: { user: boolean }) {
  const list = 'mt-2 list-inside list-decimal space-y-1 leading-relaxed text-slate-700 dark:text-slate-300'
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-6 text-slate-900 dark:text-slate-100">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-teal-700 dark:text-teal-400">← Volver a la app</Link>
      <h1 className="mt-2 text-2xl font-bold">{deleteAccountInfo.title}</h1>
      <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">{deleteAccountInfo.intro}</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Desde la app</h2>
        <ol className={list}>{deleteAccountInfo.inAppSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {user ? (
          <Link to="/ajustes" className="mt-4 flex h-12 items-center justify-center rounded-xl bg-red-600 font-semibold text-white active:bg-red-700">
            Ir a Ajustes para eliminar mi cuenta
          </Link>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Iniciá sesión en la app para eliminar tu cuenta desde Ajustes.</p>
        )}
      </section>

      {!user && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Si no podés ingresar</h2>
          <ol className={list}>{deleteAccountInfo.requestSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Eliminar%20mi%20cuenta`} className="mt-4 flex h-12 items-center justify-center rounded-xl border border-slate-300 font-semibold dark:border-slate-600">
            Escribir a {CONTACT_EMAIL}
          </a>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Qué datos se eliminan</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700 dark:text-slate-300">
          {deleteAccountInfo.dataDeleted.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">{deleteAccountInfo.retention}</p>
      </section>

      <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
        Contacto: <a className="font-medium text-teal-700 underline dark:text-teal-400" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  )
}
