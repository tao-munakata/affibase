import { Hono } from 'hono'
import { sql } from '../db/client'

const app = new Hono()

// GET /api/v1/public/sites/:slug — member-site SSR が認証なしでサイト設定を取得する
app.get('/sites/:slug', async (c) => {
  const slug = c.req.param('slug')

  const [site] = await sql`
    SELECT
      s.subdomain,
      s.site_config,
      s.status,
      t.name  AS theme_name,
      t.genre AS genre,
      t.slug  AS theme_slug
    FROM sites s
    JOIN themes t ON s.theme_id = t.id
    WHERE s.subdomain = ${slug}
      AND s.status != 'error'
  `

  if (!site) return c.json({ error: 'Not found' }, 404)

  const cfg = site.site_config as Record<string, string>
  const baseDomain = process.env.BASE_DOMAIN ?? 'affihub.jp'

  return c.json({
    slug:            site.subdomain,
    siteName:        cfg.site_title    ?? site.theme_name,
    siteDescription: cfg.site_description ?? `${site.genre}に特化した診断サイト`,
    siteUrl:         `https://${site.subdomain}.${baseDomain}`,
    genre:           site.genre,
    themeSlug:       site.theme_slug,
    operatorName:    cfg.operator_name ?? '運営者',
  })
})

export default app
