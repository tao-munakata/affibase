import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sql } from '../db/client'
import { hashPassword, verifyPassword, signToken } from '../lib/auth'
import { requireAuth, type AuthVariables } from '../middleware/auth'

const app = new Hono<{ Variables: AuthVariables }>()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
  if (existing.length > 0) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const password_hash = await hashPassword(password)
  const [user] = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${password_hash}, ${name ?? null})
    RETURNING id, email, name, plan, status, created_at
  `

  const token = signToken({ sub: user.id, email: user.email, plan: user.plan })
  return c.json({ token, user }, 201)
})

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const [user] = await sql`
    SELECT id, email, name, plan, status, password_hash
    FROM users WHERE email = ${email} LIMIT 1
  `
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  if (user.status !== 'active') {
    return c.json({ error: 'Account suspended' }, 403)
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = signToken({ sub: user.id, email: user.email, plan: user.plan })
  const { password_hash: _, ...safeUser } = user
  return c.json({ token, user: safeUser })
})

app.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const [user] = await sql`
    SELECT id, email, name, plan, status, created_at
    FROM users WHERE id = ${userId} LIMIT 1
  `
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json({ user })
})

export default app
