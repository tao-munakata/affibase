import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../lib/auth'

export type AuthVariables = {
  userId: string
  userEmail: string
  userPlan: string
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyToken(token)
    c.set('userId', payload.sub)
    c.set('userEmail', payload.email)
    c.set('userPlan', payload.plan)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
