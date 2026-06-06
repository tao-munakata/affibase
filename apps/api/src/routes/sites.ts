import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sql } from '../db/client'
import { requireAuth, type AuthVariables } from '../middleware/auth'

const app = new Hono<{ Variables: AuthVariables }>()
app.use('*', requireAuth)

const createSiteSchema = z.object({
  theme_id: z.string().uuid(),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  site_config: z.object({
    operator_name: z.string().min(1),
    operator_bio: z.string().optional(),
    site_title: z.string().optional(),
    site_description: z.string().optional(),
  }).optional(),
})

app.get('/', async (c) => {
  const userId = c.get('userId')
  const sites = await sql`
    SELECT s.*, t.name as theme_name, t.genre as theme_genre
    FROM sites s
    JOIN themes t ON s.theme_id = t.id
    WHERE s.user_id = ${userId}
    ORDER BY s.created_at DESC
  `
  return c.json({ sites })
})

app.post('/', zValidator('json', createSiteSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const [theme] = await sql`SELECT id FROM themes WHERE id = ${body.theme_id} AND is_active = true`
  if (!theme) return c.json({ error: 'Theme not found' }, 404)

  const [existing] = await sql`SELECT id FROM sites WHERE subdomain = ${body.subdomain}`
  if (existing) return c.json({ error: 'Subdomain already taken' }, 409)

  const [site] = await sql`
    INSERT INTO sites (user_id, theme_id, subdomain, site_config)
    VALUES (${userId}, ${body.theme_id}, ${body.subdomain}, ${JSON.stringify(body.site_config ?? {})})
    RETURNING *
  `

  // Queue generation job
  await sql`
    INSERT INTO generation_jobs (site_id, type, payload)
    VALUES (${site.id}, 'site_init', ${JSON.stringify({ theme_id: body.theme_id })})
  `

  return c.json({ site }, 201)
})

app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const [site] = await sql`
    SELECT s.*, t.name as theme_name, t.genre as theme_genre, t.slug as theme_slug
    FROM sites s
    JOIN themes t ON s.theme_id = t.id
    WHERE s.id = ${c.req.param('id')} AND s.user_id = ${userId}
  `
  if (!site) return c.json({ error: 'Not found' }, 404)

  const articles = await sql`
    SELECT id, title, slug, status, pv_count, search_rank, published_at, created_at
    FROM articles WHERE site_id = ${site.id}
    ORDER BY created_at DESC LIMIT 20
  `
  const jobs = await sql`
    SELECT * FROM generation_jobs WHERE site_id = ${site.id}
    ORDER BY created_at DESC LIMIT 5
  `

  return c.json({ site, articles, jobs })
})

app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const result = await sql`
    DELETE FROM sites WHERE id = ${c.req.param('id')} AND user_id = ${userId}
    RETURNING id
  `
  if (result.length === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ deleted: true })
})

export default app
