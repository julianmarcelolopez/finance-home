# 01 — ABM de tarjetas de crédito

## Descripción

Catálogo de tarjetas de crédito de la familia. Permite registrar cada tarjeta (banco, red, número de cuenta, número de socio, titular) para vincularla con los resúmenes que sube n8n.

## Estado

Implementado.

## Alcance

**Incluye:**
- Listar tarjetas activas como chips en la tab Tarjetas (Gastos.tsx → TarjetasTab)
- Modal para agregar tarjeta nueva (`NuevaTarjetaModal.tsx`)
- Toggle activo/inactivo vía `PATCH /api/tarjetas/:id`
- Chips con color por marca (Visa=azul, Mastercard=rojo, Amex=verde)

**No incluye:**
- Edición de datos de una tarjeta ya registrada (solo toggle activo)
- Eliminación (se usa `activo = false` como soft delete)
- Asociación automática tarjeta ↔ resumen (eso lo hace n8n por `nro_socio`)

## Modelo de datos

Tabla `tarjetas` en Supabase:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| banco | text | Ej: "Galicia", "ICBC" |
| marca | text | Red de pago: "Mastercard", "Visa", "Amex" |
| nro_cuenta | text | Número de cuenta/tarjeta (últimos 4 dígitos visibles en UI) |
| nro_socio | text | Número de socio sin guiones — clave de match con n8n |
| titular | text | "Julian" o "Patricia" (valor corto, no el nombre completo) |
| activo | boolean | Default true |
| created_at | timestamptz | Auto |

Tarjetas en producción:
- ICBC / Mastercard / Julian / nro_cuenta: 001747133 / nro_socio: 01500174713300
- Galicia / Mastercard / Julian / nro_cuenta: 201252 / nro_socio: 20125207
- Galicia / Mastercard / Patricia / nro_cuenta: 2279025

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tarjetas` | Lista todas (query: `incluir_inactivas=true`) |
| POST | `/api/tarjetas` | Crea nueva tarjeta |
| PATCH | `/api/tarjetas/:id` | Actualiza campos (usado para toggle `activo`) |

Body POST:
```json
{
  "banco": "Galicia",
  "marca": "Mastercard",
  "nro_cuenta": "201252",
  "nro_socio": "20125207",
  "titular": "Julian"
}
```

## Criterios de aceptación

- [ ] La grilla de chips se carga al entrar a la tab Tarjetas
- [ ] El modal de nueva tarjeta valida campos requeridos antes de hacer POST
- [ ] Al crear una tarjeta, aparece en la grilla y queda seleccionada
- [ ] `nro_socio` sin guiones (el modal debe normalizar si el usuario los ingresa)
- [ ] La primera tarjeta de la lista se selecciona automáticamente al cargar

## Dependencias

- Tabla `tarjetas` creada en Supabase (ya existe)
- n8n: el campo `nro_socio` de la tarjeta es el que usa el workflow para linkear resúmenes vía `Buscar tarjeta`
