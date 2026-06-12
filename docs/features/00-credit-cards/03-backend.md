# Fase 2 — Backend API

> **Estado:** Implementado

## Archivos creados / modificados

| Archivo | Acción |
|---|---|
| `apps/api/src/routes/tarjetas.ts` | Creado |
| `apps/api/src/routes/resumenes.ts` | Agregado filtro `tarjeta_id` |
| `apps/api/src/routes/consumos.ts` | Agregado filtro `tarjeta_id` via join |
| `apps/api/src/index.ts` | Router registrado |
| `apps/web/src/lib/api.ts` | `api.tarjetas.*` + params actualizados |

---

## `GET /api/tarjetas`

```
Parámetros:
  incluir_inactivas?: "true"   — por defecto solo activas

Respuesta: Tarjeta[]   (sin paginar — el catálogo es pequeño)
Order: banco ASC, marca ASC
```

## `POST /api/tarjetas`

```
Body: { banco, marca, nro_cuenta, titular }

Validaciones:
  - Todos los campos requeridos
  - nro_cuenta: solo dígitos (/^\d+$/)
  - titular: debe ser "Julian" o "Patricia"
  - Duplicado: 409 si ya existe banco+marca+titular+nro_cuenta

Respuesta 201: Tarjeta creada
```

## `PATCH /api/tarjetas/:id`

```
Body: { activo: boolean }
Respuesta 200: Tarjeta actualizada
Solo modifica el campo activo — cualquier otro campo del body se ignora.
```

---

## `GET /api/resumenes` — filtro agregado

```
Parámetro nuevo: tarjeta_id?: string

Comportamiento:
  - Si tarjeta_id presente → WHERE tarjeta_id = ?  (exacto, FK)
  - Si no → filtros legacy banco + titular (ILIKE)
```

## `GET /api/consumos` — filtro agregado

```
Parámetro nuevo: tarjeta_id?: string

Implementación:
  - El select ya hace !inner join con resumenes_tarjeta
  - Agrega tarjeta_id al select del join
  - Filtra con .eq('resumenes_tarjeta.tarjeta_id', tarjeta_id)
  - Tiene prioridad sobre el filtro de banco cuando ambos están presentes
```

---

## Nota sobre futuros resúmenes (n8n)

Los resúmenes nuevos que suba n8n llegan sin `tarjeta_id`. Opciones:
1. **Manual:** correr UPDATE por banco+titular después de cada carga
2. **Automatizado:** agregar lookup de `tarjetas` en el flujo de n8n al momento de insertar el resumen
