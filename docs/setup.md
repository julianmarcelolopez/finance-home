# Setup — Levantar el proyecto desde cero

## Prerrequisitos

- Node.js 20+
- Docker Desktop (con Docker Compose v2)
- Cuenta en [Supabase](https://supabase.com) con el proyecto creado

## 1. Clonar el repositorio

```bash
git clone <repo-url>
cd financehome
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los datos del proyecto Supabase:

| Variable | Dónde encontrarla |
|----------|------------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role secret |
| `VITE_SUPABASE_URL` | Igual que SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Igual que SUPABASE_ANON_KEY |
| `VITE_API_URL` | `http://localhost:3000` (dev) |

## 3. Ejecutar las migrations en Supabase

Abrir **Supabase Dashboard → SQL Editor** y ejecutar el SQL que está en [docs/modelo-de-datos.md](./modelo-de-datos.md) en la sección "SQL de Migrations".

## 4. Crear el usuario en Supabase Auth

Ir a **Supabase Dashboard → Authentication → Users → Invite user** e invitar los emails de Julian y Patricia. También se puede crear via SQL:

```sql
-- Solo en entornos de desarrollo (no producción)
SELECT supabase_auth.create_user(
  email := 'julian@ejemplo.com',
  password := 'contraseña-segura',
  email_confirm := true
);
```

## 5. Levantar con Docker

```bash
docker compose up
```

Primera vez: Docker construye las imágenes e instala dependencias (puede tardar 2-3 minutos).

- Frontend: http://localhost:5173
- API: http://localhost:3000
- Health check API: http://localhost:3000/health

Para ver logs de un servicio específico:
```bash
docker compose logs -f api
docker compose logs -f web
```

Para reconstruir después de cambiar dependencias (`package.json`):
```bash
docker compose build --no-cache
docker compose up
```

## 6. Desarrollo sin Docker (opcional)

Si preferís correr los servicios directamente:

```bash
# Instalar dependencias (monorepo root)
npm install

# Terminal 1: API
npm run dev:api

# Terminal 2: Web
npm run dev:web
```

> Nota: Sin Docker, la web conecta a `http://localhost:3000` directamente (configurado en `VITE_API_URL`).

## Solución de problemas frecuentes

### Error "Token de autenticación requerido"
La sesión de Supabase expiró. Cerrar sesión y volver a ingresar.

### Error CORS en la API
Verificar que `VITE_API_URL` en `.env` coincide exactamente con el origen del frontend. En Docker, el proxy de Vite maneja esto automáticamente.

### Tipo de cambio muestra valores fallback
La API de bluelytics.com.ar puede estar caída. Los valores fallback son aproximados. Reintentar en 5 minutos (el caché se refrescará solo).

### Volúmenes de Docker con datos viejos
```bash
docker compose down -v   # Elimina contenedores Y volúmenes
docker compose up
```

### Error de permisos en Supabase (403)
Verificar que las políticas RLS están aplicadas correctamente (ver SQL en modelo-de-datos.md). El backend usa `service_role_key` que bypassea RLS, pero si se hace alguna query directa desde el frontend, necesita la política correspondiente.
