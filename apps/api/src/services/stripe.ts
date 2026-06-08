// Stripe Billing service
// Real API: https://stripe.com/docs/api
// Keys: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID

import StripeLib from 'stripe'

type StripeInstance = InstanceType<typeof StripeLib>

let _client: StripeInstance | null = null

export function isMockMode(): boolean {
  return !process.env.STRIPE_SECRET_KEY
}

function getClient(): StripeInstance {
  if (!_client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
    _client = new StripeLib(process.env.STRIPE_SECRET_KEY)
  }
  return _client
}

export async function getOrCreateCustomer(userId: string, email: string, existingCustomerId: string | null): Promise<string> {
  const stripe = getClient()
  if (existingCustomerId) return existingCustomerId
  const customer = await stripe.customers.create({ email, metadata: { userId } })
  return customer.id
}

export async function createCheckoutSession(params: {
  customerId: string
  userId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getClient()
  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID is not set')

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
  })
  return { url: session.url!, sessionId: session.id }
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getClient()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function constructWebhookEvent(body: string, signature: string): any {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  return getClient().webhooks.constructEvent(body, signature, secret)
}
