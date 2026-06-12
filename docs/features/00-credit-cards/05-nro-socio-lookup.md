# Feature: nro_socio — lookup exacto tarjeta ↔ resumen

**Estado:** Planificado  
**Objetivo:** Que los resúmenes nuevos que sube n8n queden automáticamente enlazados a su `tarjeta_id` sin intervención manual.

---

## Contexto

El "Número de Socio" que aparece en los PDFs bancarios contiene un identificador único por cuenta, que al quitarle los guiones sirve como llave exacta de matching:

| Banco | Nro Socio en PDF | Sin guiones (= nro_socio en DB) | nro_cuenta actual (display) |
|---|---|---|---|
| ICBC Julian | `015-001747133-0-0` | `01500174713300` | `001747133` |
| Galicia Julian | `201252-0-7` | `20125207` | `201252` |
| Galicia Patricia | `2279025-0-0` | `227902500` | `2279025` |

**Decisión:** Agregar campo `nro_socio` a `tarjetas` (sin guiones) para matching exacto. `nro_cuenta` se mantiene como campo de display en el chip (los dígitos que el usuario reconoce).

---

## Fases

### Fase 1 — SQL Migration

**Archivo:** `supabase/migrations/20260601150000_tarjetas_nro_socio.sql`

```sql
ALTER TABLE tarjetas ADD COLUMN nro_socio TEXT;

UPDATE tarjetas SET nro_socio = '01500174713300'
WHERE id = '662288be-a3ff-4f63-9fb7-c69a5f46232b'; -- ICBC Julian

UPDATE tarjetas SET nro_socio = '20125207'
WHERE id = 'c937ea8c-17d1-4906-b335-37664c40b087'; -- Galicia Julian

UPDATE tarjetas SET nro_socio = '227902500'
WHERE id = 'e4a028ed-4cfa-4b19-b2d1-ccadef72b7f1'; -- Galicia Patricia

-- Una vez validado el backfill, agregar constraint NOT NULL:
-- ALTER TABLE tarjetas ALTER COLUMN nro_socio SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tarjetas_nro_socio ON tarjetas (nro_socio);
```

**Nota:** La columna arranca nullable para poder hacer el backfill primero. Después de verificar que los 3 registros tienen valor se puede agregar el NOT NULL.

---

### Fase 2 — Shared Types

**Archivo:** `packages/shared/types/index.ts`

Agregar `nro_socio` a ambas interfaces:

```typescript
export interface Tarjeta {
  // ... campos existentes ...
  nro_socio: string   // número de socio sin guiones, llave de matching con n8n
}

export interface TarjetaCreate {
  // ... campos existentes ...
  nro_socio: string
}
```

---

### Fase 3 — Backend

**Archivo:** `apps/api/src/routes/tarjetas.ts`

Cambios:
- `POST /api/tarjetas`: aceptar y validar `nro_socio` (solo dígitos, no vacío)
- `GET /api/tarjetas`: ya devuelve `*`, no requiere cambio
- Validación duplicado: agregar `nro_socio` al check de existencia previa

```typescript
// Validación en POST
if (!nro_socio || !/^\d+$/.test(nro_socio)) {
  res.status(400).json({ error: 'nro_socio debe contener solo dígitos' })
  return
}
```

---

### Fase 4 — Frontend: NuevaTarjetaModal

**Archivo:** `apps/web/src/pages/gastos/NuevaTarjetaModal.tsx`

Agregar campo "Número de socio" al formulario:
- Input que acepta el número con o sin guiones
- `onChange`: strip dashes → `value.replace(/-/g, '')`
- El valor limpio se manda como `nro_socio` al backend

**UX del campo:**
```
Label: "Número de socio"
Placeholder: "ej: 015-001747133-0-0  o  01500174713300"
Helper text: "Lo encontrás en el encabezado del resumen PDF"
```

El strip de guiones es transparente — el usuario puede pegar con o sin guiones.

---

### Fase 5 — n8n: AI Agent prompt

Agregar `nro_socio` al JSON que extrae el agente:

```json
"resumen": {
  "banco": string,
  "marca_tarjeta": string,
  "titular": string,
  "nro_resumen": string,
  "nro_socio": string,        ← nuevo
  "cierre_actual": "YYYY-MM-DD",
  ...
}
```

Regla a agregar al prompt:
```
- nro_socio: extraer el "Número de Socio" o "Nro de Socio" que aparece 
  en el encabezado del resumen. Eliminar todos los guiones y espacios. 
  Devolver solo dígitos. Ejemplo: "015-001747133-0-0" → "01500174713300"
```

---

### Fase 6 — n8n: workflow lookup + asignación

Después del paso de extracción por IA y antes del INSERT en `resumenes_tarjeta`, agregar:

**Paso A — Lookup tarjeta:**
```
HTTP GET  →  Supabase REST API
Tabla: tarjetas
Filtro: nro_socio = eq.{nro_socio_extraido}
Select: id
```

**Paso B — INSERT con tarjeta_id:**
```json
{
  "banco": "...",
  "marca_tarjeta": "...",
  "titular": "...",
  "nro_resumen": "...",
  "cierre_actual": "...",
  "vencimiento_actual": "...",
  "total_pagar_pesos": 0,
  "total_pagar_dolares": 0,
  "tarjeta_id": "{id_del_paso_A}"   ← asignado automáticamente
}
```

Si el lookup no encuentra nada (nro_socio no registrado en `tarjetas`), el INSERT sigue sin `tarjeta_id` y aparece en Supabase para revisión manual.

---

## Orden de ejecución

1. ✅ Correr SQL migration (Fase 1) — el usuario lo ejecuta en Supabase
2. Tipos + backend + frontend (Fases 2-4) — Claude los implementa
3. Modificar el prompt del AI Agent en n8n (Fase 5) — el usuario lo edita
4. Agregar steps en el workflow de n8n (Fase 6) — coordinado con el usuario

---

## Resultado esperado

Cada vez que n8n procese un PDF nuevo:
- El agente extrae `nro_socio` → lo limpia (sin guiones)
- n8n busca en `tarjetas` por `nro_socio` → obtiene `tarjeta_id`
- El INSERT en `resumenes_tarjeta` lleva `tarjeta_id` asignado
- El resumen aparece automáticamente bajo la tarjeta correcta en la app

Sin intervención manual, sin fuzzy matching.
