# Flujo de Datos

## Pipeline completo: PDF → Frontend

```
PDF Resumen Galicia Mastercard (email o descarga manual)
        │
        ▼
┌───────────────────────────────────┐
│  n8n (workflow externo)           │
│                                   │
│  1. Trigger: Email con PDF        │
│  2. Extraer PDF adjunto           │
│  3. Parse con PDF extractor node  │
│  4. Mapear campos:                │
│     - banco, marca_tarjeta        │
│     - cierre, vencimiento         │
│     - total_pesos, total_dolares  │
│  5. INSERT en resumenes_tarjeta   │
│  6. Por cada línea de consumo:    │
│     INSERT en consumos_tarjeta    │
└──────────────┬────────────────────┘
               │ Supabase REST API (service role)
               ▼
┌───────────────────────────────────┐
│  Supabase PostgreSQL              │
│                                   │
│  resumenes_tarjeta                │
│  consumos_tarjeta                 │
│  gastos_fijos (manual)            │
│  ingresos (manual)                │
│  proyectos (manual)               │
└──────────────┬────────────────────┘
               │
       ┌───────┴──────┐
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────────────┐
│  API Express │  │  Supabase Auth            │
│  :3000       │  │                           │
│              │  │  - Valida JWT             │
│  Agrega:     │  │  - Gestiona sesiones      │
│  - Tipo de   │  │                           │
│    cambio    │  └──────────────────────────┘
│  - Cálculos  │
│  - Filtros   │
└──────┬───────┘
       │ HTTP (JWT)
       ▼
┌───────────────────────────────────┐
│  React SPA                        │
│  :5173                            │
│                                   │
│  Dashboard → resumen del mes      │
│  Gastos → tabla de consumos       │
│  Planificación → flujo de caja    │
│  Proyectos → metas de ahorro      │
│  Inversiones → placeholder        │
└───────────────────────────────────┘
```

## Flujo del tipo de cambio

```
API Express (cada request de dashboard/planificación)
        │
        ├── Cache en memoria válido? (< 5 min)
        │       │
        │       YES ─────────────────────► Devolver cache
        │       │
        │       NO
        │       ▼
        └── GET https://api.bluelytics.com.ar/v2/latest
                │
                ├── OK ────► Parsear, cachear 5 min, devolver
                │
                └── Error ─► Devolver cache anterior o valores fallback
```

## Flujo de autenticación

```
Usuario → Login page (frontend)
        │
        ▼
supabase.auth.signInWithPassword({ email, password })
        │
        ├── Error ─► Mostrar "Email o contraseña incorrectos"
        │
        └── OK ─► session.access_token guardado en localStorage
                        │
                        ▼
              React Router → redirigir a Dashboard
                        │
                        ▼
              Cada request a /api:
              headers: { Authorization: "Bearer <jwt>" }
                        │
                        ▼
              API middleware: supabaseAdmin.auth.getUser(jwt)
                        │
                        ├── Error ─► 401 Unauthorized
                        │
                        └── OK ─► procesar request
```

## Flujo carga manual (gastos fijos, ingresos, proyectos)

Actualmente los datos se cargan directamente en Supabase via SQL o la interfaz de Supabase Studio. En el futuro, el frontend tendrá formularios de alta (la API ya tiene los endpoints POST implementados).

## Flujo futuro: BullMarket / Binance

```
API Express /api/inversiones
        │
        ├── GET BullMarket API (token de usuario)
        │       └── portfolio: acciones, cedears, FCI
        │
        └── GET Binance API (API key + secret)
                └── balances: BTC, USDT, stablecoins

        ▼
Consolidar en respuesta única
        ▼
Frontend: página Inversiones con portfolio
```
