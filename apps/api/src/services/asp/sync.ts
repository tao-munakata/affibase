import { sql } from '../../db/client'
import { fetchA8Programs, fetchA8Transactions } from './a8'
import { fetchATPrograms, fetchATPerformance } from './accesstrade'

export interface SyncOfferResult {
  asp: string
  inserted: number
  updated: number
  total: number
}

export interface SyncReportResult {
  asp: string
  days_processed: number
  total_clicks: number
  total_revenue: number
}

export async function syncOffers(): Promise<SyncOfferResult[]> {
  const results: SyncOfferResult[] = []

  // ── A8.net ───────────────────────────────────────────────────────────
  const a8Programs = await fetchA8Programs()
  let a8Inserted = 0
  let a8Updated = 0

  for (const p of a8Programs) {
    const existing = await sql`SELECT id FROM offers WHERE asp = 'a8' AND external_id = ${p.program_id}`
    if (existing.length === 0) {
      await sql`
        INSERT INTO offers (asp, external_id, name, description, genre, commission, approval_rate, epc, affiliate_url, product_url, status)
        VALUES ('a8', ${p.program_id}, ${p.program_name}, ${p.program_name}, ${p.category},
                ${p.reward_amount}, ${p.approval_rate}, ${p.epc}, ${p.affiliate_link}, ${p.program_url},
                ${p.status === 'active' ? 'active' : 'paused'})
      `
      a8Inserted++
    } else {
      await sql`
        UPDATE offers SET
          name          = ${p.program_name},
          commission    = ${p.reward_amount},
          approval_rate = ${p.approval_rate},
          epc           = ${p.epc},
          affiliate_url = ${p.affiliate_link},
          product_url   = ${p.program_url},
          status        = ${p.status === 'active' ? 'active' : 'paused'}
        WHERE asp = 'a8' AND external_id = ${p.program_id}
      `
      a8Updated++
    }
  }
  results.push({ asp: 'a8', inserted: a8Inserted, updated: a8Updated, total: a8Programs.length })

  // ── AccessTrade ───────────────────────────────────────────────────────
  const atPrograms = await fetchATPrograms()
  let atInserted = 0
  let atUpdated = 0

  for (const p of atPrograms) {
    const existing = await sql`SELECT id FROM offers WHERE asp = 'accesstrade' AND external_id = ${p.program_id}`
    if (existing.length === 0) {
      await sql`
        INSERT INTO offers (asp, external_id, name, description, genre, commission, approval_rate, epc, affiliate_url, product_url, status)
        VALUES ('accesstrade', ${p.program_id}, ${p.program_name}, ${p.program_name}, ${p.genre},
                ${p.reward}, ${p.approve_rate}, ${p.epc}, ${p.tracking_url}, ${p.url},
                ${p.status === 'active' ? 'active' : 'paused'})
      `
      atInserted++
    } else {
      await sql`
        UPDATE offers SET
          name          = ${p.program_name},
          commission    = ${p.reward},
          approval_rate = ${p.approve_rate},
          epc           = ${p.epc},
          affiliate_url = ${p.tracking_url},
          product_url   = ${p.url},
          status        = ${p.status === 'active' ? 'active' : 'paused'}
        WHERE asp = 'accesstrade' AND external_id = ${p.program_id}
      `
      atUpdated++
    }
  }
  results.push({ asp: 'accesstrade', inserted: atInserted, updated: atUpdated, total: atPrograms.length })

  console.log('[asp-sync] offers sync complete:', JSON.stringify(results))
  return results
}

export async function syncReports(): Promise<SyncReportResult[]> {
  const toDate = new Date().toISOString().slice(0, 10)
  const fromDate = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

  // Get all active sites to distribute report data
  const sites = await sql`SELECT id FROM sites WHERE status = 'active' LIMIT 10`
  if (sites.length === 0) {
    console.warn('[asp-sync] no active sites — skip report sync')
    return []
  }

  const results: SyncReportResult[] = []

  // ── A8.net transactions ───────────────────────────────────────────────
  const a8Txns = await fetchA8Transactions(fromDate, toDate)

  // Aggregate by date
  const a8ByDate = new Map<string, { clicks: number; conversions: number; revenue: number }>()
  for (const t of a8Txns) {
    const curr = a8ByDate.get(t.date) ?? { clicks: 0, conversions: 0, revenue: 0 }
    a8ByDate.set(t.date, {
      clicks:      curr.clicks      + t.click_count,
      conversions: curr.conversions  + t.approved_count,
      revenue:     curr.revenue      + t.reward_amount,
    })
  }

  let a8Clicks = 0, a8Revenue = 0
  for (const [date, agg] of a8ByDate) {
    const siteId = sites[0].id  // primary site gets A8 data
    await sql`
      INSERT INTO revenue_reports (site_id, report_date, pv_count, affiliate_conversions, affiliate_revenue)
      VALUES (${siteId}, ${date}, ${agg.clicks * 10}, ${agg.conversions}, ${agg.revenue})
      ON CONFLICT (site_id, report_date) DO UPDATE SET
        affiliate_conversions = revenue_reports.affiliate_conversions + EXCLUDED.affiliate_conversions,
        affiliate_revenue     = revenue_reports.affiliate_revenue     + EXCLUDED.affiliate_revenue
    `
    a8Clicks += agg.clicks
    a8Revenue += agg.revenue
  }
  results.push({ asp: 'a8', days_processed: a8ByDate.size, total_clicks: a8Clicks, total_revenue: a8Revenue })

  // ── AccessTrade performance ───────────────────────────────────────────
  const atPerfs = await fetchATPerformance(fromDate, toDate)

  const atByDate = new Map<string, { clicks: number; conversions: number; revenue: number }>()
  for (const p of atPerfs) {
    const curr = atByDate.get(p.date) ?? { clicks: 0, conversions: 0, revenue: 0 }
    atByDate.set(p.date, {
      clicks:      curr.clicks      + p.click_count,
      conversions: curr.conversions  + p.approve_count,
      revenue:     curr.revenue      + p.reward,
    })
  }

  let atClicks = 0, atRevenue = 0
  const atSite = sites[1] ?? sites[0]  // second site gets AT data, fallback to first
  for (const [date, agg] of atByDate) {
    await sql`
      INSERT INTO revenue_reports (site_id, report_date, pv_count, affiliate_conversions, affiliate_revenue)
      VALUES (${atSite.id}, ${date}, ${agg.clicks * 8}, ${agg.conversions}, ${agg.revenue})
      ON CONFLICT (site_id, report_date) DO UPDATE SET
        affiliate_conversions = revenue_reports.affiliate_conversions + EXCLUDED.affiliate_conversions,
        affiliate_revenue     = revenue_reports.affiliate_revenue     + EXCLUDED.affiliate_revenue
    `
    atClicks += agg.clicks
    atRevenue += agg.revenue
  }
  results.push({ asp: 'accesstrade', days_processed: atByDate.size, total_clicks: atClicks, total_revenue: atRevenue })

  console.log('[asp-sync] reports sync complete:', JSON.stringify(results))
  return results
}
