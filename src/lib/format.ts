/** Sentence case: solo la primera letra en mayúscula ("Noviembre 2026", "Miércoles 18 de noviembre"). Nunca usar la clase CSS capitalize. */
export function sentence(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase('es-AR') + s.slice(1) : s
}
