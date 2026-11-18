/** Sentence case: solo la primera letra en mayúscula ("Noviembre 2026", "Miércoles 18 de noviembre"). Nunca usar la clase CSS capitalize. */
export function sentence(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase('es-AR') + s.slice(1) : s
}

/** Permite cortar línea después de "/" (ej. "Casa/Alquiler" → "Casa/ Alquiler" en pantallas angostas o con letra grande). */
export function softBreak(s: string): string {
  return s.replace(/\//g, '/​')
}
