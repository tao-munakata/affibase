import { sql } from '../db/client'
// sql.json() wraps JS objects for JSONB columns (postgres driver requirement)
import { generateArticle, generateLlmsTxt } from './ai'

const ARTICLE_KEYWORDS: Record<string, string[]> = {
  '副業': [
    '副業 始め方 会社員',
    '副業 おすすめ 在宅',
    'Webライター 始め方',
    'クラウドワークス 使い方',
    '副業 月5万 実現方法',
    '副業 確定申告 やり方',
    'ブログ 副業 収入',
    '転売 副業 初心者',
    'データ入力 副業 稼ぎ方',
    '副業 バレない方法',
  ],
  '転職': [
    '転職 タイミング 30代',
    '転職エージェント おすすめ',
    '転職 志望動機 書き方',
    '転職 面接 対策',
    '年収アップ 転職 コツ',
    '未経験 転職 IT',
    '転職 自己PR 例文',
    '転職 退職理由 答え方',
    'doda リクルートエージェント 比較',
    '転職活動 期間 平均',
  ],
  'AIツール': [
    'ChatGPT 副業 活用法',
    'Claude 使い方 ビジネス',
    'AI ライティング ツール おすすめ',
    'ChatGPT Plus 料金 メリット',
    'AI 画像生成 稼ぐ方法',
    'プロンプト エンジニアリング 入門',
    'AIツール 比較 2025',
    'Notion AI 使い方',
    'Perplexity AI Google 違い',
    'AI 自動化 副業',
  ],
}

export async function initializeSite(jobId: string, siteId: string, themeId: string): Promise<void> {
  await sql`
    UPDATE generation_jobs SET status = 'running', started_at = NOW()
    WHERE id = ${jobId}
  `

  try {
    const [site] = await sql`SELECT * FROM sites WHERE id = ${siteId}`
    const [theme] = await sql`SELECT * FROM themes WHERE id = ${themeId}`
    if (!site || !theme) throw new Error('Site or theme not found')

    const config = site.site_config as Record<string, string>
    const keywords = ARTICLE_KEYWORDS[theme.genre] ?? ARTICLE_KEYWORDS['副業']

    // Generate up to 5 articles in parallel (rate limit consideration)
    const batch = keywords.slice(0, 5)
    const articles = await Promise.allSettled(
      batch.map((kw) =>
        generateArticle({
          keyword: kw,
          genre: theme.genre,
          category: '副業始め方系',
          themeDescription: theme.description ?? theme.name,
          operatorName: config.operator_name ?? '運営者',
          operatorBio: config.operator_bio,
        })
      )
    )

    for (let i = 0; i < batch.length; i++) {
      const result = articles[i]
      if (result.status !== 'fulfilled') {
        console.error(`[site-generator] article ${i + 1} failed:`, result.reason)
        continue
      }

      const a = result.value
      const slug = `article-${String(i + 1).padStart(3, '0')}`

      await sql`
        INSERT INTO articles (site_id, title, slug, content, meta_description, focus_keyword, category, faq_data, json_ld, status)
        VALUES (
          ${siteId},
          ${a.title},
          ${slug},
          ${a.content},
          ${a.metaDescription},
          ${batch[i]},
          '始め方系',
          ${sql.json(a.faqData)},
          ${sql.json(a.jsonLd as Parameters<typeof sql.json>[0])},
          'draft'
        )
        ON CONFLICT (site_id, slug) DO NOTHING
      `
    }

    // Generate llms.txt
    const llmsTxt = await generateLlmsTxt({
      subdomain: site.subdomain,
      themeDescription: theme.description ?? theme.name,
      genre: theme.genre,
      operatorName: config.operator_name ?? '運営者',
    })

    const aeoConfig = {
      llms_txt: llmsTxt,
      robots_txt: [
        'User-agent: *',
        'Allow: /',
        '',
        'User-agent: GPTBot',
        'Allow: /',
        '',
        'User-agent: ClaudeBot',
        'Allow: /',
        '',
        'User-agent: PerplexityBot',
        'Allow: /',
        '',
        `Sitemap: https://${site.subdomain}.affihub.jp/sitemap.xml`,
      ].join('\n'),
      generated_at: new Date().toISOString(),
    }

    await sql`
      UPDATE sites
      SET status = 'active', aeo_config = ${sql.json(aeoConfig)}, published_at = NOW()
      WHERE id = ${siteId}
    `

    await sql`
      UPDATE generation_jobs
      SET status = 'done', finished_at = NOW(), result = ${sql.json({ articles_generated: batch.length })}
      WHERE id = ${jobId}
    `
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await sql`
      UPDATE generation_jobs
      SET status = 'failed', finished_at = NOW(), error = ${message}
      WHERE id = ${jobId}
    `
    await sql`UPDATE sites SET status = 'error' WHERE id = ${siteId}`
    throw err
  }
}
