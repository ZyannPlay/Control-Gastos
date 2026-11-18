import { supabase, supabaseConfigured } from './supabase'
import { toSpanishError } from '../hooks/errors'

const APP_KEYS = ['last_currency', 'fx_blue_v1']

/** Borra la cuenta del usuario actual. Devuelve null si salió bien o un mensaje de error en español. */
export async function deleteMyAccount(): Promise<string | null> {
  if (!supabaseConfigured) return 'Falta configurar Supabase (.env)'
  const { error } = await supabase.rpc('delete_my_account')
  if (error) return toSpanishError(error)
  try {
    await supabase.auth.signOut({ scope: 'local' }) // el usuario ya no existe en el servidor
  } catch {
    // el usuario ya no existe; ignoramos
  }
  try {
    for (const k of APP_KEYS) localStorage.removeItem(k)
  } catch {
    // ignorar
  }
  return null
}
