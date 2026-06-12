# Arquitectura del Sistema

## Descripción

FinanceHome es una app de finanzas familiares para Julian y Patricia. Centraliza consumos de tarjetas de crédito (procesados automáticamente desde PDFs via n8n), gastos fijos, proyectos de ahorro y —en el futuro— inversiones de BullMarket y Binance.

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 18 + Vite + TypeScript | SPA rápida, HMR en dev, tipado completo |
| UI | Tailwind CSS + shadcn/ui | Componentes accesibles sin overhead de CSS-in-JS |
| Backend | Node.js + Express + TypeScript | Simple, familiar, perfecto para una API privada |
| Base de datos | Supabase (PostgreSQL) | BaaS con Auth, realtime y almacenamiento incluido |
| Auth | Supabase Auth (email/password) | JWT gestionado por Supabase, sin código extra |
| Infra | Docker Compose | Consistencia entre dev y cualquier VPS futuro |
| Automatización | n8n (externo) | Procesa PDFs de resúmenes y carga datos en Supabase |

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (desktop)                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │          React SPA (apps/web, puerto 5173)        │   │
│  │  Dashboard · Gastos · Planificación · Proyectos   │   │
│  └──────────┬─────────────────────────┬──────────────┘   │
└─────────────┼─────────────────────────┼────────────────-─┘
              │ HTTP (JWT Bearer)        │ SDK Supabase Auth
              ▼                         ▼
┌─────────────────────┐    ┌────────────────────────────┐
│  Express API        │    │  Supabase                   │
│  (apps/api :3000)   │    │  ┌──────────┐ ┌──────────┐ │
│                     │    │  │PostgreSQL│ │   Auth   │ │
│  /dashboard         ├───►│  │          │ │  (JWT)   │ │
│  /consumos          │    │  └──────────┘ └──────────┘ │
│  /resumenes         │    └────────────────────────────┘
│  /gastos-fijos      │                 ▲
│  /planificacion     │                 │
│  /proyectos         │    ┌────────────┴───────────┐
└─────────────────────┘    │  n8n (externo)          │
                           │  PDF → parse → INSERT   │
                           └────────────────────────┘
```

## Decisiones técnicas

### Sin turborepo/nx
El monorepo es simple: `apps/*` y `packages/*`. npm workspaces maneja las dependencias. No hay build pipeline cross-package porque `packages/shared` solo exporta tipos TypeScript (sin compilación en runtime).

### Shared types via path alias
En lugar de compilar `@financehome/shared`, Vite y tsx resuelven el alias directamente al archivo `.ts`:
- `vite.config.ts`: `resolve.alias`
- `tsconfig.json`: `paths`

Ventaja: sin paso de build para el paquete compartido.

### Tipo de cambio via API externa
Se llama a `bluelytics.com.ar` desde la API y se cachea en memoria 5 minutos. El frontend nunca llama a APIs externas directamente — todo pasa por la API propia.

### Supabase Auth con service role en backend
El frontend usa el `anon key` para autenticarse. El backend usa el `service role key` para acceder a los datos sin restricciones de RLS, pero verifica el JWT del usuario antes de cada request mediante `supabase.auth.getUser(token)`.

### Desktop first
Sin breakpoints mobile. Layout de sidebar fijo de 224px, contenido en el área restante.

## Flujo de autenticación

```
1. Usuario → POST /login (Supabase Auth directo desde frontend)
2. Supabase → devuelve JWT (access_token)
3. Frontend guarda session en localStorage (manejado por Supabase SDK)
4. Cada request a /api → header "Authorization: Bearer <jwt>"
5. API → supabaseAdmin.auth.getUser(jwt) → verifica con Supabase
6. Si válido → procesa request
```
