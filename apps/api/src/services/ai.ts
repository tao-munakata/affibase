import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

export interface ArticleGenerationInput {
  keyword: string
  genre: string
  category: string
  themeDescription: string
  operatorName: string
  operatorBio?: string
  relatedOffers?: Array<{ name: string; description: string }>
}

export interface GeneratedArticle {
  title: string
  metaDescription: string
  content: string
  faqData: Array<{ q: string; a: string }>
  jsonLd: Record<string, unknown>
}

export async function generateArticle(input: ArticleGenerationInput): Promise<GeneratedArticle> {
  const ai = getClient()

  const offersText = input.relatedOffers?.length
    ? `\n関連アフィリエイト案件:\n${input.relatedOffers.map((o) => `- ${o.name}: ${o.description}`).join('\n')}`
    : ''

  const prompt = `以下の条件でAEO対応SEO記事（約2000字）をJSON形式で生成してください。

キーワード: ${input.keyword}
ジャンル: ${input.genre}
カテゴリ: ${input.category}
サイトテーマ: ${input.themeDescription}
運営者名: ${input.operatorName}
${input.operatorBio ? `運営者プロフィール: ${input.operatorBio}` : ''}${offersText}

【AEO要件】
- 記事冒頭100字以内に明確な定義文を配置
- 本文中に比較表を1つ以上含める（Markdownテーブル形式）
- 末尾にFAQ（5問）を配置
- PR表記を含める

出力形式（JSONのみ、説明不要）:
{
  "title": "記事タイトル（30〜60字）",
  "metaDescription": "メタディスクリプション（80〜120字）",
  "content": "記事本文（Markdown形式、約2000字）",
  "faqData": [{"q": "質問", "a": "回答（200字以内）"}, ...（5問）],
  "jsonLd": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "タイトル",
    "author": {"@type": "Person", "name": "${input.operatorName}"},
    "about": {"@type": "Thing", "name": "${input.keyword}"}
  }
}`

  const message = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse AI response as JSON')

  return JSON.parse(jsonMatch[0]) as GeneratedArticle
}

export interface DiagnosisPatternInput {
  themeDescription: string
  genre: string
  patternKey: string
  answers: Record<string, unknown>
}

export async function generateDiagnosisResult(input: DiagnosisPatternInput): Promise<{
  title: string
  description: string
  faq: Array<{ q: string; a: string }>
}> {
  const ai = getClient()

  const prompt = `アフィリエイト診断サイト（ジャンル: ${input.genre}）の診断結果を生成してください。

テーマ: ${input.themeDescription}
診断パターン: ${input.patternKey}
回答内容: ${JSON.stringify(input.answers, null, 2)}

出力形式（JSONのみ）:
{
  "title": "診断結果タイトル（20字以内）",
  "description": "診断結果の説明（150〜200字、具体的なアドバイスを含む）",
  "faq": [{"q": "質問", "a": "回答（100字以内）"}, ...（3問）]
}`

  const message = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse AI response')

  return JSON.parse(jsonMatch[0]) as { title: string; description: string; faq: Array<{ q: string; a: string }> }
}

export async function generateLlmsTxt(site: {
  subdomain: string
  themeDescription: string
  genre: string
  operatorName: string
}): Promise<string> {
  return `# AffiBase Site: ${site.subdomain}.affihub.jp

## サイト概要
> ${site.themeDescription}（運営: ${site.operatorName}）

## 主要コンテンツ
- /shindan : ${site.genre}診断ツール（50パターン）
- /articles : ${site.genre}関連SEO記事（100本）
- /recommend : おすすめ${site.genre}サービス比較

## 案件データAPI
- GET /api/v1/offers : 案件一覧（JSON）
- GET /api/v1/offers/{id} : 案件詳細
- POST /api/v1/diagnosis : 診断実行

## 更新頻度
記事：月2〜5本追加
案件：リアルタイム更新

## 対象読者
${site.genre}に興味のある日本在住の個人・会社員
`
}
