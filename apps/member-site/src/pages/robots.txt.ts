import type { APIRoute } from 'astro'
import { extractSlug } from '../lib/siteConfig'

export const GET: APIRoute = async ({ request }) => {
  const baseDomain = import.meta.env.BASE_DOMAIN ?? 'affihub.jp'
  const devSlug = import.meta.env.SITE_SLUG

  const slug = extractSlug(request.headers.get('host'), baseDomain, devSlug)
  const siteUrl = `https://${slug}.${baseDomain}`

  const content = [
    'User-agent: *',
    'Allow: /',
    '',
    '# AI Crawlers — explicitly allowed for AEO',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: Amazonbot',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n')

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
