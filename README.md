# Mis Gastos

PWA para controlar tus gastos e ingresos en pesos (ARS) y dólares (USD). Convierte automáticamente con la cotización del dólar blue (venta) de [dolarapi.com](https://dolarapi.com), tiene login propio y guarda tus datos en Supabase.

## Qué tiene

- Cargar gastos e ingresos en ARS o USD, con categoría, fecha y nota. Cada movimiento guarda la cotización blue del momento.
- Cotización dólar blue automática, cacheada por día.
- Login y datos por usuario en Supabase.
- Presupuestos por categoría, con alertas al 80% y al 100%.
- Gráficas y reportes.
- Se instala en el celular como app.

## Stack

- React 19 + TypeScript
- Vite 8 + vite-plugin-pwa
- Tailwind CSS v4
- react-router-dom v7
- Recharts (gráficas)
- Supabase (auth y base de datos) con supabase-js v2
- Vitest (tests)

## Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com). El plan gratis alcanza.
2. Abrí **SQL Editor**, pegá el contenido de `supabase/migrations/001_init.sql` y ejecutalo.
3. Copiá el **Project URL** y la **anon key** desde **Settings → API**.
4. Creá un archivo `.env` en la raíz del proyecto, basado en `.env.example`:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

5. En **Authentication → URL Configuration**, poné en **Site URL** la URL donde esté desplegada la app. Para probar en local, usá `http://localhost:5173`.
6. Opcional: para permitir login con Google, andá a **Authentication → Providers → Google**, habilitalo y cargá el Client ID y Client Secret que creás en Google Cloud Console. Supabase te muestra la URL de callback que tenés que registrar allá.

## Desarrollo local

Necesitás Node.js (versión LTS reciente).

```bash
npm install
npm run dev      # servidor local en http://localhost:5173
npm test         # tests con Vitest
npm run build    # chequeo de TypeScript + build de producción en dist/
```

## Deploy gratis en Vercel

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com), elegí **Add New → Project** e importá el repo.
3. Vercel detecta Vite solo. En **Environment Variables** agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos valores de tu `.env`.
4. Tocá **Deploy**.
5. Copiá la URL que te da Vercel y ponela como **Site URL** en Supabase (paso 5 de arriba).

Las variables `VITE_*` se incluyen al momento de compilar. Si las agregás después del primer deploy, tenés que volver a desplegar.

**Alternativa: Netlify**

1. En [netlify.com](https://netlify.com), elegí **Add new site → Import an existing project** y conectá GitHub.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Agregá las mismas dos variables en **Environment variables**.
4. Desplegá y actualizá la URL en Supabase.

## Instalar en el celular

- **Android:** abrí la URL en Chrome, tocá el menú (⋮) y elegí **Instalar app**.
- **iPhone:** abrí la URL en Safari, tocá **Compartir** y después **Agregar a inicio**.

## Equipo de subagentes de Claude Code

El proyecto tiene cuatro subagentes en `.claude/agents/`:

| Agente | Modelo | Rol |
|---|---|---|
| `docs-helper` | haiku | Redacta README, guías de instalación/deploy y textos de la app en español. |
| `frontend-dev` | sonnet | Implementa pantallas y componentes React mobile-first, la PWA y las gráficas. |
| `backend-supabase` | sonnet | Diseña el esquema SQL, las políticas RLS, auth y los hooks de datos. |
| `qa-tester` | haiku | Escribe tests con Vitest, corre build y prueba en viewport móvil con Playwright. Reporta bugs con archivo y línea. |

**Cómo se usan:** Claude Code carga los agentes al iniciar sesión. Los invocás pidiendo algo como "usá el agente qa-tester para..." o con `@qa-tester`.

**Cómo cambiar el modelo:** editá el campo `model:` del frontmatter (el bloque entre `---` al principio) del archivo `.claude/agents/<nombre>.md`. Valores posibles: `sonnet`, `haiku`, `opus` o `inherit` (usa el mismo modelo de la sesión).

```yaml
---
name: qa-tester
model: sonnet
---
```

## Estructura de carpetas

```
gastos-app/
├── .claude/agents/        # subagentes de Claude Code
├── public/                # favicon e íconos estáticos
├── src/
│   ├── lib/
│   │   ├── types.ts       # tipos compartidos (contrato de datos)
│   │   ├── supabase.ts    # cliente de Supabase
│   │   └── fx.ts          # cotización dólar blue y conversiones
│   ├── App.tsx            # rutas y login
│   ├── main.tsx           # punto de entrada
│   ├── index.css
│   ├── pages/             # pantallas
│   ├── components/        # componentes, como BottomNav
│   └── hooks/             # hooks, como useAuth
├── supabase/migrations/   # esquema SQL, 001_init.sql
├── .env.example           # variables de entorno de ejemplo
├── vite.config.ts         # Vite + PWA (manifest y caché de la cotización)
└── package.json
```
