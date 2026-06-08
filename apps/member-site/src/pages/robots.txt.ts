import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE_URL ?? 'https://demo.affihub.jp'
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
