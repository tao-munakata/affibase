import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const API_URL = import.meta.env.API_URL ?? 'http://localhost:3001'
  const SITE_SLUG = import.meta.env.SITE_SLUG ?? 'demo'
  const SITE_NAME = import.meta.env.SITE_NAME ?? '副業診断サイト'
  const THEME_GENRE = import.meta.env.THEME_GENRE ?? '副業'
  const OPERATOR_NAME = import.meta.env.OPERATOR_NAME ?? '運営者'

  const content = [
    `# ${SITE_NAME}`,
    '',
    '## サイト概要',
    `> ${SITE_NAME}。${THEME_GENRE}に特化した診断サイト（運営: ${OPERATOR_NAME}）`,
    '',
    '## 主要コンテンツ',
    `- /shindan : ${THEME_GENRE}診断ツール（50パターン）`,
    '- /articles : SEO記事（100本）',
    '- /recommend : おすすめサービス比較',
    '',
    '## 案件データAPI',
    `- GET ${API_URL}/api/v1/offers?genre=${encodeURIComponent(THEME_GENRE)} : 案件一覧（JSON）`,
    `- POST ${API_URL}/api/v1/diagnosis : 診断実行`,
    '',
    '## 更新頻度',
    '記事：月2〜5本追加',
    '案件：リアルタイム更新',
    '',
    '## 対象読者',
    `${THEME_GENRE}に興味のある日本在住の個人・会社員`,
  ].join('\n')

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
