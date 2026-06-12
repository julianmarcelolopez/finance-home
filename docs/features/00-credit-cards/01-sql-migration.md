# Fase 0 — SQL Migration

> **Quién lo ejecuta:** Usuario, en el SQL Editor de Supabase.  
> **Cuándo:** Antes de correr cualquier código de la feature.  
> **Archivo:** `supabase/migrations/20260601120000_add_tarjetas_credit_card_catalog.sql`

## Verificación

Después de correr el script, confirmá con:

```sql
SELECT * FROM tarjetas;
-- Debe devolver 0 filas sin error
```

## Datos iniciales opcionales

Si querés pre-cargar las tarjetas que ya aparecen en los resúmenes existentes, podés inferirlas así:

```sql
-- Ver combinaciones banco+marca+titular únicas en resumenes_tarjeta
SELECT DISTINCT banco, marca_tarjeta, titular
FROM resumenes_tarjeta
ORDER BY banco, marca_tarjeta, titular;
```

Luego insertá manualmente una fila en `tarjetas` por cada combinación, con los `ultimos_4` correctos.

## Notas

- `ultimos_4` tiene CHECK de longitud 4 — el backend valida esto antes de insertar.
- El vínculo con `resumenes_tarjeta` es por `banco + marca + titular` (Opción A). No hay FK entre las tablas.
- `marca` en `tarjetas` equivale a `marca_tarjeta` en `resumenes_tarjeta` — mismo valor de texto.
