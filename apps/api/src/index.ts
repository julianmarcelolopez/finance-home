import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { authMiddleware } from './middleware/auth'
import { swaggerSpec } from './swagger'
import dashboardRouter from './routes/dashboard'
import consumosRouter from './routes/consumos'
import resumenesRouter from './routes/resumenes'
import gastosFijosRouter from './routes/gastos-fijos'
import planificacionRouter from './routes/planificacion'
import proyectosRouter from './routes/proyectos'
import tarjetasRouter from './routes/tarjetas'
import etiquetasRouter from './routes/etiquetas'
import gastosDashboardRouter from './routes/gastos-dashboard'

const app = express()
const PORT = process.env.PORT || 3000

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

app.get('/', (_req, res) => res.redirect('/docs'))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.get('/spec', (_req, res) => res.json(swaggerSpec))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api', authMiddleware)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/consumos', consumosRouter)
app.use('/api/resumenes', resumenesRouter)
app.use('/api/gastos-fijos', gastosFijosRouter)
app.use('/api/planificacion', planificacionRouter)
app.use('/api/proyectos', proyectosRouter)
app.use('/api/tarjetas', tarjetasRouter)
app.use('/api/etiquetas', etiquetasRouter)
app.use('/api/gastos-dashboard', gastosDashboardRouter)

app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`)
})
