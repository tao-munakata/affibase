import { Hono } from 'hono'
import { sql } from '../db/client'
import { requireAuth, type AuthVariables } from '../middleware/auth'

const app = new Hono<{ Variables: AuthVariables }>()
app.use('*', requireAuth)

app.get('/summary', async (c) => {
  const userId = c.get('userId')
  const days = Number(c.req.query('days') ?? 30)

  const sites = await sql`
    SELECT s.id, s.subdomain, s.status
    FROM sites s WHERE s.user_id = ${userId}
  `
  const siteIds = sites.map((s) => s.id)
  if (siteIds.length === 0) return c.json({ summary: null, sites: [] })

  const [agg] = await sql`
    SELECT
      COALESCE(SUM(pv_count), 0)              AS total_pv,
      COALESCE(SUM(uu_count), 0)              AS total_uu,
      COALESCE(SUM(affiliate_conversions), 0) AS total_conversions,
      COALESCE(SUM(affiliate_revenue), 0)     AS total_affiliate_revenue,
      COALESCE(SUM(ad_revenue), 0)            AS total_ad_revenue,
      COALESCE(SUM(pdf_revenue), 0)           AS total_pdf_revenue,
      COALESCE(SUM(ai_citations), 0)          AS total_ai_citations
    FROM revenue_reports
    WHERE site_id = ANY(${siteIds})
      AND report_date >= CURRENT_DATE - INTERVAL '1 day' * ${days}
  `

  const daily = await sql`
    SELECT
      report_date,
      SUM(pv_count) AS pv,
      SUM(affiliate_revenue + ad_revenue + pdf_revenue) AS revenue
    FROM revenue_reports
    WHERE site_id = ANY(${siteIds})
      AND report_date >= CURRENT_DATE - INTERVAL '1 day' * ${days}
    GROUP BY report_date
    ORDER BY report_date ASC
  `

  return c.json({ summary: agg, daily, sites })
})

app.get('/site/:siteId', async (c) => {
  const userId = c.get('userId')
  const siteId = c.req.param('siteId')

  const [site] = await sql`SELECT id FROM sites WHERE id = ${siteId} AND user_id = ${userId}`
  if (!site) return c.json({ error: 'Not found' }, 404)

  const reports = await sql`
    SELECT * FROM revenue_reports
    WHERE site_id = ${siteId}
    ORDER BY report_date DESC
    LIMIT 90
  `
  return c.json({ reports })
})

export default app
