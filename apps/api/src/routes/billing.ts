import { Hono } from 'hono'
import { sql } from '../db/client'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import {
  isMockMode,
  getOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
} from '../services/stripe'

const app = new Hono<{ Variables: AuthVariables }>()

const PLATFORM_URL = process.env.NEXT_PUBLIC_API_URL?.replace(':3001', ':3100') ?? 'http://localhost:3100'

// ── GET /billing/plan ─────────────────────────────────────────────────
app.get('/plan', requireAuth, async (c) => {
  const userId = c.get('userId')
  const [user] = await sql`
    SELECT plan, stripe_customer_id, stripe_subscription_id, plan_expires_at
    FROM users WHERE id = ${userId}
  `
  return c.json({
    plan: user.plan as string,
    mock_mode: isMockMode(),
    customer_id: user.stripe_customer_id ?? null,
    subscription_id: user.stripe_subscription_id ?? null,
    plan_expires_at: user.plan_expires_at ?? null,
    limits: planLimits(user.plan as string),
  })
})

// ── POST /billing/checkout ────────────────────────────────────────────
// Mock: upgrades user directly. Real: creates Stripe Checkout session.
app.post('/checkout', requireAuth, async (c) => {
  const userId = c.get('userId')
  const userEmail = c.get('userEmail')

  if (isMockMode()) {
    console.warn('[billing] mock mode — upgrading user directly without Stripe')
    await sql`UPDATE users SET plan = 'pro' WHERE id = ${userId}`
    return c.json({ mock: true, plan: 'pro', upgraded: true })
  }

  const [user] = await sql`SELECT plan, stripe_customer_id FROM users WHERE id = ${userId}`
  if (user.plan === 'pro') return c.json({ error: 'Already on Pro plan' }, 400)

  const customerId = await getOrCreateCustomer(userId, userEmail, user.stripe_customer_id)
  if (!user.stripe_customer_id) {
    await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${userId}`
  }

  const { url, sessionId } = await createCheckoutSession({
    customerId,
    userId,
    successUrl: `${PLATFORM_URL}/billing?success=1`,
    cancelUrl:  `${PLATFORM_URL}/billing?canceled=1`,
  })
  return c.json({ url, session_id: sessionId })
})

// ── POST /billing/portal ──────────────────────────────────────────────
app.post('/portal', requireAuth, async (c) => {
  const userId = c.get('userId')

  if (isMockMode()) {
    return c.json({ mock: true, message: 'Stripe未設定のためポータルは利用できません' })
  }

  const [user] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${userId}`
  if (!user.stripe_customer_id) return c.json({ error: 'No Stripe customer found' }, 404)

  const url = await createPortalSession(user.stripe_customer_id, `${PLATFORM_URL}/billing`)
  return c.json({ url })
})

// ── POST /billing/mock-upgrade ────────────────────────────────────────
// Dev only: toggle plan between free <-> pro without Stripe
app.post('/mock-upgrade', requireAuth, async (c) => {
  if (!isMockMode()) return c.json({ error: 'Only available in mock mode' }, 403)
  const userId = c.get('userId')
  const [user] = await sql`SELECT plan FROM users WHERE id = ${userId}`
  const nextPlan = user.plan === 'pro' ? 'free' : 'pro'
  await sql`UPDATE users SET plan = ${nextPlan} WHERE id = ${userId}`
  return c.json({ ok: true, plan: nextPlan })
})

// ── POST /billing/webhook ─────────────────────────────────────────────
// No auth — Stripe signs the request with STRIPE_WEBHOOK_SECRET
app.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature')
  if (!signature) return c.json({ error: 'Missing stripe-signature' }, 400)

  let event
  try {
    event = constructWebhookEvent(await c.req.text(), signature)
  } catch (err) {
    console.error('[billing] webhook signature verification failed:', err)
    return c.json({ error: 'Invalid signature' }, 400)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as { metadata?: { userId?: string }; customer?: string; subscription?: string }
      const userId = session.metadata?.userId
      if (userId) {
        await sql`
          UPDATE users SET
            plan = 'pro',
            stripe_customer_id = ${session.customer ?? null},
            stripe_subscription_id = ${session.subscription ?? null}
          WHERE id = ${userId}
        `
        console.log(`[billing] user ${userId} upgraded to pro`)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as { customer: string }
      await sql`
        UPDATE users SET plan = 'free', stripe_subscription_id = NULL
        WHERE stripe_customer_id = ${sub.customer}
      `
      console.log(`[billing] subscription deleted for customer ${sub.customer}`)
      break
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as { customer: string }
      console.warn(`[billing] payment failed for customer ${inv.customer}`)
      break
    }
  }

  return c.json({ received: true })
})

function planLimits(plan: string) {
  if (plan === 'pro') return { max_sites: null, label: 'Pro', price_jpy: 2980 }
  return { max_sites: 1, label: 'Free', price_jpy: 0 }
}

export default app
