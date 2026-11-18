import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { Browser } from '@capacitor/browser'
import { toSpanishError } from './errors'
import { AUTH_CALLBACK, isNative } from '../lib/native'

const NO_CONFIG = 'Falta configurar Supabase (.env)'

function translate(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos'
  if (m.includes('email not confirmed')) return 'Confirmá tu email antes de ingresar'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese email ya está registrado'
  if (m.includes('password should be at least')) return 'La contraseña es demasiado corta'
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'El email no es válido'
  if (m.includes('rate limit')) return 'Demasiados intentos, probá de nuevo en un rato'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Error de conexión, revisá tu internet'
  return toSpanishError(msg)
}

export function useAuth(): {
  user: User | null
  loading: boolean
  signIn(email: string, password: string): Promise<string | null>
  signUp(email: string, password: string): Promise<string | null>
  signInWithGoogle(): Promise<string | null>
  signOut(): Promise<void>
} {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      setUser(null)
      return
    }
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseConfigured) return NO_CONFIG
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? translate(error.message) : null
    } catch (e) {
      return translate(e instanceof Error ? e.message : '')
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabaseConfigured) return NO_CONFIG
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      return error ? translate(error.message) : null
    } catch (e) {
      return translate(e instanceof Error ? e.message : '')
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabaseConfigured) return NO_CONFIG
    try {
      if (isNative()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: AUTH_CALLBACK, skipBrowserRedirect: true },
        })
        if (error) return translate(error.message)
        if (data?.url) await Browser.open({ url: data.url })
        return null
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      return error ? translate(error.message) : null
    } catch (e) {
      return translate(e instanceof Error ? e.message : '')
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) return
    await supabase.auth.signOut()
  }, [])

  return { user, loading, signIn, signUp, signInWithGoogle, signOut }
}
