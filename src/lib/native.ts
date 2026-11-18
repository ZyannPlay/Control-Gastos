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
      if (p === '/' || p === '/login') void App.exitApp()
      else navigate(-1)
    }),
  )

  handles.push(
    App.addListener('appUrlOpen', ({ url }) => {
      if (!url.startsWith(AUTH_CALLBACK)) return
      void (async () => {
        try {
          const q = url.split('?')[1]?.split('#')[0] ?? ''
          const code = new URLSearchParams(q).get('code')
          if (code) await supabase.auth.exchangeCodeForSession(code)
        } catch { /* ignorar */ }
        try { await Browser.close() } catch { /* ignorar */ }
      })()
    }),
  )

  return () => { handles.forEach((h) => void h.then((x) => x.remove()).catch(() => {})) }
}
