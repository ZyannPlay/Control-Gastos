import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.zyannplay.misgastos',
  appName: 'Mis Gastos',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#0f766e', showSpinner: false },
  },
}

export default config
