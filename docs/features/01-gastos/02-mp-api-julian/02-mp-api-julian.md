# 02 — Mercadopago API — cuenta Julián

## Descripción

Conexión con la API de Mercadopago para importar automáticamente los movimientos de la cuenta de Julián (pagos QR, transferencias recibidas/enviadas, pagos con tarjeta MP).

## Estado

**Bloqueada** — se prioriza la carga manual ([tarea 07](../07-mercadopago-carga-manual/00-overview.md)), ya implementada. Sin fecha definida para retomar el sync por API.

## Alcance

**Incluye:**
- Autenticación con MP API usando las credenciales de la cuenta de Julián (OAuth o access token)
- Consulta de movimientos del período actual (`/v1/account/settlement_report` o `/v1/money_movements`)
- Guardado de movimientos en una tabla nueva `movimientos_mp`
- Visualización en la tab Mercadopago: lista de movimientos con fecha, descripción y monto

**No incluye:**
- Movimientos de la cuenta de Patricia (ver tarea 03)
- Procesamiento de pagos o devoluciones (solo lectura)
- Sincronización histórica retroactiva (se arranca desde la fecha de configuración)

## Modelo de datos

Tabla nueva a crear: `movimientos_mp`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| mp_id | text UNIQUE | ID del movimiento en MP (evita duplicados) |
| persona | text | "Julian" |
| fecha | date | Fecha del movimiento |
| descripcion | text | Texto del movimiento (ej: "Pago en CARREFOUR") |
| monto | numeric | Positivo = ingreso, negativo = gasto |
| moneda | text | "ARS" o "USD" |
| tipo | text | "pago", "transferencia", "recarga", "cobro" |
| categoria_id | uuid FK | Nullable, se asigna al etiquetar |
| created_at | timestamptz | Auto |

Migración SQL a agregar en `docs/modelo-de-datos.md`.

## Endpoints nuevos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/movimientos-mp` | Lista movimientos (query: `persona`, `mes`, `tipo`) |
| POST | `/api/movimientos-mp/sync` | Dispara sincronización con MP API |

## Criterios de aceptación

- [ ] Al entrar a la tab Mercadopago se muestran los movimientos del mes actual
- [ ] Los movimientos se sincronizan automáticamente una vez por día (o con botón manual)
- [ ] No se duplican movimientos si se sincroniza dos veces
- [ ] Gastos muestran monto en rojo, ingresos en verde
- [ ] Se puede filtrar por tipo (pagos / transferencias / cobros)

## Dependencias

- Credenciales MP API de la cuenta de Julián (access token o app OAuth)
- Tabla `movimientos_mp` creada en Supabase
- Feature 03-etiquetas: para asignar categoría a cada movimiento importado
- Definir si se hace el sync desde n8n (como las tarjetas) o desde la API Express
