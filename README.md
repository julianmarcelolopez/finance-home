# FinanceHome

App de finanzas familiares para Julian y Patricia. Monorepo con React + Express + Supabase.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Infra**: Docker Compose

## Estructura

```
financehome/
├── apps/
│   ├── web/          # Frontend React + Vite
│   └── api/          # Backend Express
├── packages/
│   └── shared/       # Tipos TypeScript compartidos
└── docs/             # Documentación del sistema
```

## Inicio rápido

```bash
cp .env.example .env
# Completar las variables en .env con los datos de Supabase

docker compose up
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

Ver [docs/setup.md](docs/setup.md) para instrucciones completas.
