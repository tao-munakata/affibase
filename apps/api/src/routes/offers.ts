import { Hono } from 'hono'
import { sql } from '../db/client'

const app = new Hono()

// Public endpoint — AI agents can call this
app.get('/', async (c) => {
  const genre = c.req.query('genre')
  const asp = c.req.query('asp')

  let query = sql`SELECT * FROM offers WHERE status = 'active'`

  const offers = genre
    ? await sql`SELECT * FROM offers WHERE status = 'active' AND genre = ${genre} ORDER BY commission DESC NULLS LAST`
    : asp
    ? await sql`SELECT * FROM offers WHERE status = 'active' AND asp = ${asp} ORDER BY commission DESC NULLS LAST`
    : await sql`SELECT * FROM offers WHERE status = 'active' ORDER BY epc DESC NULLS LAST`

  return c.json({ offers })
})

app.get('/:id', async (c) => {
  const [offer] = await sql`SELECT * FROM offers WHERE id = ${c.req.param('id')}`
  if (!offer) return c.json({ error: 'Not found' }, 404)
  return c.json({ offer })
})

export default app
