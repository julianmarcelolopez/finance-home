import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinanceHome API',
      version: '1.0.0',
      description: 'API de finanzas familiares — Julian & Patricia',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },

        // --- Tarjetas ---
        Tarjeta: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            banco:      { type: 'string', example: 'Galicia' },
            marca:      { type: 'string', example: 'Mastercard' },
            nro_cuenta: { type: 'string', example: '201252' },
            nro_socio:  { type: 'string', example: '20125207' },
            titular:    { type: 'string', enum: ['Julian', 'Patricia'] },
            activo:     { type: 'boolean' },
            dia_cierre: { type: 'integer', minimum: 1, maximum: 31, nullable: true, description: 'Día del mes en que cierra el ciclo. Solo informativo/display.' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        TarjetaCreate: {
          type: 'object',
          required: ['banco', 'marca', 'nro_cuenta', 'nro_socio', 'titular'],
          properties: {
            banco:      { type: 'string', example: 'Galicia' },
            marca:      { type: 'string', example: 'Mastercard' },
            nro_cuenta: { type: 'string', example: '201252' },
            nro_socio:  { type: 'string', example: '20125207' },
            titular:    { type: 'string', enum: ['Julian', 'Patricia'] },
            dia_cierre: { type: 'integer', minimum: 1, maximum: 31 },
          },
        },

        // --- Resúmenes ---
        ResumenTarjeta: {
          type: 'object',
          properties: {
            id:                  { type: 'string', format: 'uuid' },
            banco:               { type: 'string', example: 'Galicia' },
            marca_tarjeta:       { type: 'string', example: 'Mastercard Black' },
            titular:             { type: 'string', example: 'Lopez, Julian Marcelo' },
            nro_resumen:         { type: 'string' },
            cierre_actual:       { type: 'string', format: 'date' },
            vencimiento_actual:  { type: 'string', format: 'date' },
            total_pagar_pesos:   { type: 'number' },
            total_pagar_dolares: { type: 'number' },
            tarjeta_id:          { type: 'string', format: 'uuid', nullable: true },
            created_at:          { type: 'string', format: 'date-time' },
          },
        },

        // --- Consumos ---
        ConsumoTarjeta: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            resumen_id:       { type: 'string', format: 'uuid' },
            fecha:            { type: 'string', format: 'date' },
            referencia:       { type: 'string', example: 'CARREFOUR EXPRESS' },
            comprobante:      { type: 'string', nullable: true },
            pesos:            { type: 'number' },
            dolares:          { type: 'number' },
            adicional:        { type: 'boolean' },
            nro_resumen:      { type: 'string' },
            categoria_id:     { type: 'string', format: 'uuid', nullable: true },
            es_fijo:          { type: 'boolean' },
            cuota_actual:     { type: 'integer', nullable: true },
            cantidad_cuotas:  { type: 'integer', nullable: true },
            created_at:       { type: 'string', format: 'date-time' },
          },
        },

        // --- Etiquetas ---
        Categoria: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            nombre:     { type: 'string', example: 'Supermercado' },
            color:      { type: 'string', example: '#16a34a' },
            icono:      { type: 'string', example: 'shopping-cart' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        ComercioCategoria: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            patron:       { type: 'string', example: 'CARREFOUR' },
            categoria_id: { type: 'string', format: 'uuid' },
            es_fijo:      { type: 'boolean' },
            created_at:   { type: 'string', format: 'date-time' },
            categorias: {
              type: 'object',
              nullable: true,
              properties: {
                nombre: { type: 'string' },
                color:  { type: 'string' },
                icono:  { type: 'string' },
              },
            },
          },
        },

        // --- Gastos Fijos ---
        GastoFijo: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            nombre:       { type: 'string', example: 'Expensas' },
            monto:        { type: 'number', example: 85000 },
            moneda:       { type: 'string', enum: ['ARS', 'USD'] },
            categoria:    { type: 'string', nullable: true },
            dia_del_mes:  { type: 'integer', minimum: 1, maximum: 31, example: 10 },
            fecha_inicio: { type: 'string', format: 'date' },
            fecha_fin:    { type: 'string', format: 'date', nullable: true },
            persona:      { type: 'string', enum: ['Julian', 'Patricia', 'Compartido'] },
            activo:       { type: 'boolean' },
            created_at:   { type: 'string', format: 'date-time' },
          },
        },
        GastoFijoCreate: {
          type: 'object',
          required: ['nombre', 'monto', 'moneda', 'persona', 'dia_del_mes', 'fecha_inicio'],
          properties: {
            nombre:       { type: 'string', example: 'Expensas' },
            monto:        { type: 'number', example: 85000 },
            moneda:       { type: 'string', enum: ['ARS', 'USD'] },
            categoria:    { type: 'string' },
            dia_del_mes:  { type: 'integer', minimum: 1, maximum: 31, example: 10 },
            fecha_inicio: { type: 'string', format: 'date', example: '2026-01-01' },
            fecha_fin:    { type: 'string', format: 'date' },
            persona:      { type: 'string', enum: ['Julian', 'Patricia', 'Compartido'] },
          },
        },

        // --- Mercadopago (carga manual) ---
        GastoMercadopago: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            fecha:        { type: 'string', format: 'date' },
            descripcion:  { type: 'string', example: 'Verdulería feria' },
            monto:        { type: 'number', example: 4500 },
            moneda:       { type: 'string', enum: ['ARS', 'USD'] },
            persona:      { type: 'string', enum: ['Julian', 'Patricia', 'Compartido'] },
            categoria_id: { type: 'string', format: 'uuid', nullable: true },
            created_at:   { type: 'string', format: 'date-time' },
          },
        },
        GastoMercadopagoCreate: {
          type: 'object',
          required: ['fecha', 'descripcion', 'monto', 'moneda', 'persona'],
          properties: {
            fecha:        { type: 'string', format: 'date', example: '2026-06-05' },
            descripcion:  { type: 'string', example: 'Verdulería feria' },
            monto:        { type: 'number', example: 4500 },
            moneda:       { type: 'string', enum: ['ARS', 'USD'] },
            persona:      { type: 'string', enum: ['Julian', 'Patricia', 'Compartido'] },
            categoria_id: { type: 'string', format: 'uuid' },
          },
        },

        // --- Resumen mensual proyectado ---
        ComponenteResumenMensual: {
          type: 'object',
          properties: {
            nombre:             { type: 'string', example: 'Visa Galicia — Julian' },
            tipo:               { type: 'string', enum: ['real', 'estimado'] },
            monto_ars:          { type: 'number', example: 1180300 },
            detalle:            { type: 'string', nullable: true, example: 'cierra el 18/07 (estimado)' },
            alerta_desvio:      { type: 'boolean' },
            porcentaje_desvio:  { type: 'number', nullable: true, example: 23 },
          },
        },
        ResumenMensualProyectado: {
          type: 'object',
          properties: {
            mes:                     { type: 'string', example: '2026-07' },
            ingresos_ars:            { type: 'number', example: 3909738 },
            ingresos_cantidad:       { type: 'integer', example: 1 },
            gastos_reales_ars:       { type: 'number', example: 1980400 },
            gastos_estimados_ars:    { type: 'number', example: 1432500 },
            gastos_totales_ars:      { type: 'number', example: 3412900 },
            saldo_proyectado_ars:    { type: 'number', example: 496838 },
            porcentaje_comprometido: { type: 'number', example: 87.3 },
            componentes:             { type: 'array', items: { $ref: '#/components/schemas/ComponenteResumenMensual' } },
          },
        },

        // --- Proyectos ---
        Proyecto: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            nombre:         { type: 'string', example: 'Fondo de emergencia' },
            meta:           { type: 'number', example: 5000000 },
            moneda:         { type: 'string', enum: ['ARS', 'USD'] },
            actual:         { type: 'number', example: 1200000 },
            fecha_objetivo: { type: 'string', format: 'date', nullable: true },
            prioridad:      { type: 'string', enum: ['alta', 'media', 'baja'] },
            notas:          { type: 'string', nullable: true },
            created_at:     { type: 'string', format: 'date-time' },
          },
        },
        ProyectoCreate: {
          type: 'object',
          required: ['nombre', 'meta', 'moneda', 'prioridad'],
          properties: {
            nombre:         { type: 'string', example: 'Fondo de emergencia' },
            meta:           { type: 'number', example: 5000000 },
            moneda:         { type: 'string', enum: ['ARS', 'USD'] },
            fecha_objetivo: { type: 'string', format: 'date' },
            prioridad:      { type: 'string', enum: ['alta', 'media', 'baja'] },
            notas:          { type: 'string' },
          },
        },

        // --- Dashboard ---
        TipoCambio: {
          type: 'object',
          properties: {
            oficial:    { type: 'object', properties: { compra: { type: 'number' }, venta: { type: 'number' } } },
            blue:       { type: 'object', properties: { compra: { type: 'number' }, venta: { type: 'number' } } },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        DashboardResumen: {
          type: 'object',
          properties: {
            mes_actual:            { type: 'string', example: '2026-06' },
            total_consumos_pesos:  { type: 'number' },
            total_consumos_dolares:{ type: 'number' },
            gastos_fijos_mes_ars:  { type: 'number' },
            proyectos_activos:     { type: 'integer' },
            proximos_vencimientos: { type: 'array', items: { $ref: '#/components/schemas/ResumenTarjeta' } },
            tipo_cambio:           { $ref: '#/components/schemas/TipoCambio' },
          },
        },

        // --- Gastos Dashboard ---
        ResumenOrigen: {
          type: 'object',
          properties: {
            nombre:     { type: 'string', example: 'MC Galicia — Julian' },
            pesos:      { type: 'number' },
            dolares:    { type: 'number' },
            disponible: { type: 'boolean', description: 'false = fuente no implementada todavía (ej: Efectivo)' },
          },
        },
        ResumenCategoriaMes: {
          type: 'object',
          properties: {
            nombre:     { type: 'string', example: 'Salud' },
            color:      { type: 'string', example: '#dc2626' },
            monto:      { type: 'number' },
            porcentaje: { type: 'number' },
          },
        },
        Top5Consumo: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            fecha:      { type: 'string', format: 'date' },
            referencia: { type: 'string' },
            pesos:      { type: 'number' },
            dolares:    { type: 'number' },
            origen:     { type: 'string', example: 'MC Galicia — Julian' },
            adicional:  { type: 'boolean' },
          },
        },
        ConsumoMes: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            fecha:            { type: 'string', format: 'date' },
            referencia:       { type: 'string' },
            pesos:            { type: 'number' },
            dolares:          { type: 'number' },
            origen:           { type: 'string' },
            categoria_nombre: { type: 'string', nullable: true },
            categoria_color:  { type: 'string', nullable: true },
            es_fijo:          { type: 'boolean' },
            adicional:        { type: 'boolean' },
          },
        },
        DetalleMes: {
          type: 'object',
          properties: {
            mes:             { type: 'string', example: '2026-06' },
            total_pesos:     { type: 'number' },
            total_dolares:   { type: 'number' },
            fijos_pesos:     { type: 'number' },
            variables_pesos: { type: 'number' },
            por_origen:      { type: 'array', items: { $ref: '#/components/schemas/ResumenOrigen' } },
            por_categoria:   { type: 'array', items: { $ref: '#/components/schemas/ResumenCategoriaMes' } },
            top5:            { type: 'array', items: { $ref: '#/components/schemas/Top5Consumo' } },
            consumos:        { type: 'array', items: { $ref: '#/components/schemas/ConsumoMes' } },
          },
        },
        ResumenSemestral: {
          type: 'object',
          properties: {
            mes:           { type: 'string', example: '2026-06' },
            total_pesos:   { type: 'number' },
            total_dolares: { type: 'number' },
          },
        },

        // --- Planificación ---
        FlujoCajaMes: {
          type: 'object',
          properties: {
            mes:              { type: 'string', example: '2026-06' },
            ingresos:         { type: 'number' },
            gastos_fijos:     { type: 'number' },
            gastos_variables: { type: 'number' },
            saldo:            { type: 'number' },
            saldo_acumulado:  { type: 'number' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, 'routes', '*.ts')],
}

export const swaggerSpec = swaggerJsdoc(options)
