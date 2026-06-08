import { Hono } from 'hono'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import { syncOffers, syncReports } from '../services/asp/sync'
import { sql } from '../db/client'

const app = new Hono<{ Variables: AuthVariables }>()
app.use('*', requireAuth)

// POST /api/v1/asp/sync/offers — A8+AccessTrade 案件同期
app.post('/sync/offers', async (c) => {
  try {
    const results = await syncOffers()
    const totalInserted = results.reduce((s, r) => s + r.inserted, 0)
    const totalUpdated  = results.reduce((s, r) => s + r.updated, 0)
    return c.json({ ok: true, results, summary: { inserted: totalInserted, updated: totalUpdated } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[asp] sync offers failed:', message)
    return c.json({ ok: false, error: message }, 500)
  }
})

// POST /api/v1/asp/sync/reports — 過去30日の成果データ同期
app.post('/sync/reports', async (c) => {
  try {
    const results = await syncReports()
    const totalRevenue = results.reduce((s, r) => s + r.total_revenue, 0)
    return c.json({ ok: true, results, summary: { total_revenue: totalRevenue } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[asp] sync reports failed:', message)
    return c.json({ ok: false, error: message }, 500)
  }
})

// GET /api/v1/asp/status — 現在のoffer件数と最終同期状況
app.get('/status', async (c) => {
  const counts = await sql`
    SELECT asp, status, COUNT(*) as count
    FROM offers
    GROUP BY asp, status
    ORDER BY asp, status
  `
  const a8Key  = !!process.env.A8_API_KEY
  const atKey  = !!process.env.ACCESSTRADE_API_KEY

  return c.json({
    api_keys: { a8: a8Key ? 'set' : 'not_set', accesstrade: atKey ? 'set' : 'not_set' },
    mock_mode: !a8Key || !atKey,
    offers_by_asp: counts,
  })
})

export default app
