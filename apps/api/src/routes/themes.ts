import { Hono } from 'hono'
import { sql } from '../db/client'
import { requireAuth, type AuthVariables } from '../middleware/auth'

const app = new Hono<{ Variables: AuthVariables }>()

app.get('/', async (c) => {
  const genre = c.req.query('genre')
  const themes = genre
    ? await sql`SELECT * FROM themes WHERE is_active = true AND genre = ${genre} ORDER BY difficulty_score ASC`
    : await sql`SELECT * FROM themes WHERE is_active = true ORDER BY monthly_searches DESC NULLS LAST`
  return c.json({ themes })
})

app.get('/:slug', async (c) => {
  const [theme] = await sql`SELECT * FROM themes WHERE slug = ${c.req.param('slug')} AND is_active = true`
  if (!theme) return c.json({ error: 'Not found' }, 404)

  const patterns = await sql`
    SELECT * FROM diagnosis_patterns WHERE theme_id = ${theme.id}
  `
  return c.json({ theme, patterns })
})

export default app
