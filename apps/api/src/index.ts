import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import authRoutes from './routes/auth'
import themesRoutes from './routes/themes'
import sitesRoutes from './routes/sites'
import offersRoutes from './routes/offers'
import diagnosisRoutes from './routes/diagnosis'
import reportsRoutes from './routes/reports'
import generateRoutes from './routes/generate'

const app = new Hono()

app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://platform:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
  ],
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

app.route('/api/v1/auth',      authRoutes)
app.route('/api/v1/themes',    themesRoutes)
app.route('/api/v1/sites',     sitesRoutes)
app.route('/api/v1/offers',    offersRoutes)
app.route('/api/v1/diagnosis', diagnosisRoutes)
app.route('/api/v1/reports',   reportsRoutes)
app.route('/api/v1/generate',  generateRoutes)

// OpenAPI spec endpoint (stub — expand later)
app.get('/api/v1/openapi.json', (c) => c.json({
  openapi: '3.0.0',
  info: { title: 'AffiBase API', version: '1.0.0' },
  paths: {},
}))

const port = Number(process.env.PORT ?? 3001)
console.log(`AffiBase API listening on port ${port}`)

serve({ fetch: app.fetch, port })

export default app
