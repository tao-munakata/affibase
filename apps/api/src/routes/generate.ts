import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sql } from '../db/client'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import { initializeSite } from '../services/site-generator'

const app = new Hono<{ Variables: AuthVariables }>()
app.use('*', requireAuth)

app.post('/site/:siteId', async (c) => {
  const userId = c.get('userId')
  const siteId = c.req.param('siteId')

  const [site] = await sql`
    SELECT s.*, t.id as theme_id
    FROM sites s JOIN themes t ON s.theme_id = t.id
    WHERE s.id = ${siteId} AND s.user_id = ${userId}
  `
  if (!site) return c.json({ error: 'Site not found' }, 404)

  const [runningJob] = await sql`
    SELECT id FROM generation_jobs
    WHERE site_id = ${siteId} AND status IN ('queued', 'running')
    ORDER BY created_at DESC LIMIT 1
  `
  if (runningJob) return c.json({ error: 'Already generating' }, 409)

  const [job] = await sql`
    INSERT INTO generation_jobs (site_id, type, payload)
    VALUES (${siteId}, 'site_init', ${JSON.stringify({ theme_id: site.theme_id })})
    RETURNING *
  `
  await sql`UPDATE sites SET status = 'generating' WHERE id = ${siteId}`

  // Fire and forget (in production, use a queue like BullMQ)
  setImmediate(async () => {
    try {
      await initializeSite(job.id, siteId, site.theme_id)
    } catch (err) {
      console.error('[generate] site init failed:', err)
    }
  })

  return c.json({ job_id: job.id, status: 'started' }, 202)
})

app.get('/jobs/:siteId', async (c) => {
  const userId = c.get('userId')
  const siteId = c.req.param('siteId')

  const [site] = await sql`SELECT id FROM sites WHERE id = ${siteId} AND user_id = ${userId}`
  if (!site) return c.json({ error: 'Not found' }, 404)

  const jobs = await sql`
    SELECT * FROM generation_jobs WHERE site_id = ${siteId}
    ORDER BY created_at DESC LIMIT 10
  `
  return c.json({ jobs })
})

export default app
