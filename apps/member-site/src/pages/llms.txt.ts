import type { APIRoute } from 'astro'
import { extractSlug, fetchSiteConfig } from '../lib/siteConfig'

export const GET: APIRoute = async ({ request }) => {
  const baseDomain = import.meta.env.BASE_DOMAIN ?? 'affihub.jp'
  const apiUrl = import.meta.env.API_URL ?? 'http://localhost:3001'
  const devSlug = import.meta.env.SITE_SLUG

  const slug = extractSlug(request.headers.get('host'), baseDomain, devSlug)
  const cfg = await fetchSiteConfig(slug, apiUrl, baseDomain)

  const content = [
    `# ${cfg.siteName}`,
    '',
    '## サイト概要',
    `> ${cfg.siteName}。${cfg.genre}に特化した診断サイト（運営: ${cfg.operatorName}）`,
    '',
    '## 主要コンテンツ',
    `- /shindan : ${cfg.genre}診断ツール（50パターン）`,
    '- /articles : SEO記事（100本）',
    '- /recommend : おすすめサービス比較',
    '',
    '## 案件データAPI',
    `- GET ${apiUrl}/api/v1/offers?genre=${encodeURIComponent(cfg.genre)} : 案件一覧（JSON）`,
    `- POST ${apiUrl}/api/v1/diagnosis : 診断実行`,
    '',
    '## 更新頻度',
    '記事：月2〜5本追加',
    '案件：リアルタイム更新',
    '',
    '## 対象読者',
    `${cfg.genre}に興味のある日本在住の個人・会社員`,
  ].join('\n')

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
