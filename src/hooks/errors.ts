const FALLBACK = 'No se pudo completar la acción. Probá de nuevo.'

function messageOf(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const o = err as { message?: unknown; code?: unknown }
    const parts = [typeof o.message === 'string' ? o.message : '', typeof o.code === 'string' ? o.code : '']
    return parts.join(' ')
  }
  return ''
}

/** Traduce errores comunes de Supabase/Postgres/red a mensajes en español. */
export function toSpanishError(err: unknown): string {
  const m = messageOf(err).toLowerCase()
  if (!m) return FALLBACK
  if (m.includes('failed to fetch') || m.includes('fetch failed') || m.includes('networkerror') || m.includes('network request failed') || m.includes('network error') || m.includes('load failed')) {
    return 'Sin conexión. Revisá tu internet.'
  }
  if (m.includes('jwt expired') || m.includes('jwt') || m.includes('invalid refresh token') || m.includes('refresh token not found') || m.includes('session expired') || m.includes('not authenticated') || m.includes('auth session missing')) {
    return 'Tu sesión expiró, volvé a ingresar.'
  }
  if (m.includes('duplicate key') || m.includes('already exists') || m.includes('23505')) return 'Ya existe.'
  if (m.includes('violates foreign key') || m.includes('23503')) return 'Está en uso por otros datos.'
  if (m.includes('check constraint') || m.includes('23514')) return 'Algún valor no es válido.'
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('429')) return 'Demasiados intentos, esperá un momento.'
  return FALLBACK
}
