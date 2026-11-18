import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { supabase } from './supabase'

export const AUTH_CALLBACK = 'com.zyannplay.misgastos://auth-callback'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/** Inicializa integraciones nativas. Devuelve una función de limpieza. No-op en web. */
export function initNative(navigate: (delta: number) => void, getPath: () => string): () => void {
  if (!isNative()) return () => {}
  const handles: Promise<{ remove: () => Promise<void> }>[] = []

  void (async () => {
    try {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#0f766e' })
    } catch { /* ignorar */ }
    try { await SplashScreen.hide() } catch { /* ignorar */ }
  })()

  handles.push(
    App.addListener('backButton', () => {
      const p = getPath()
      // Sin historial (p. ej. la app arrancó en una ruta interna) → salir en lugar de quedarse trabado.
      if (p === '/' || p === '/login' || window.history.length <= 1) void App.exitApp()
      else navigate(-1)
    }),
  )

  const handleAuthUrl = async (url: string) => {
    if (!url.startsWith(AUTH_CALLBACK)) return
    try {
      const q = url.split('?')[1]?.split('#')[0] ?? ''
      const params = new URLSearchParams(q)
      const code = params.get('code')
      const err = params.get('error_description') || params.get('error')
      if (err) throw new Error(err)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error
      }
    } catch (e) {
      console.warn('Login con Google falló', e)
      window.alert('No se pudo completar el ingreso con Google. Probá de nuevo.')
    }
    try { await Browser.close() } catch { /* ignorar */ }
  }

  handles.push(App.addListener('appUrlOpen', ({ url }) => { void handleAuthUrl(url) }))
  // Si la app arrancó en frío desde el deep link, el evento ya pasó: leer la URL de lanzamiento.
  void App.getLaunchUrl().then((r) => { if (r?.url) void handleAuthUrl(r.url) }).catch(() => {})

  return () => { handles.forEach((h) => void h.then((x) => x.remove()).catch(() => {})) }
}
