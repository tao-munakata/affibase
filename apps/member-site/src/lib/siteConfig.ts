export interface SiteConfig {
  slug: string
  siteName: string
  siteDescription: string
  siteUrl: string
  genre: string
  themeSlug: string
  operatorName: string
}

export function extractSlug(host: string | null, baseDomain: string, devSlug?: string): string {
  const fallback = devSlug ?? 'demo'
  if (!host) return fallback
  const hostname = host.split(':')[0]
  if (!hostname.endsWith(`.${baseDomain}`)) return fallback
  const slug = hostname.slice(0, -(baseDomain.length + 1))
  return slug || fallback
}

export async function fetchSiteConfig(slug: string, apiUrl: string, baseDomain: string): Promise<SiteConfig> {
  const fallback: SiteConfig = {
    slug,
    siteName: '副業診断サイト',
    siteDescription: 'あなたに最適な副業をAIが診断します',
    siteUrl: `https://${slug}.${baseDomain}`,
    genre: '副業',
    themeSlug: 'fukugyou-shindan',
    operatorName: '運営者',
  }
  try {
    const res = await fetch(`${apiUrl}/api/v1/public/sites/${slug}`)
    if (!res.ok) return fallback
    return (await res.json()) as SiteConfig
  } catch {
    return fallback
  }
}
