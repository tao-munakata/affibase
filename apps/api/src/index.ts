import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import authRoutes from './routes/auth'
import themesRoutes from './routes/themes'
import sitesRoutes from './routes/sites'
import offersRoutes from './routes/offers'
import diagnosisRoutes from './routes/diagnosis'
import reportsRoutes from './routes/reports'
import generateRoutes from './routes/generate'
import aspRoutes from './routes/asp'
import billingRoutes from './routes/billing'
import publicRoutes from './routes/public'

const app = new Hono()

app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3100',
      'http://localhost:4321',
      'http://platform:3000',
      ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
    ]
    const baseDomain = process.env.BASE_DOMAIN ?? 'affihub.jp'
    if (allowed.includes(origin)) return origin
    if (origin.endsWith(`.${baseDomain}`) || origin === `https://${baseDomain}`) return origin
    return null
  },
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

app.route('/api/v1/auth',      authRoutes)
app.route('/api/v1/themes',    themesRoutes)
app.route('/api/v1/sites',     sitesRoutes)
app.route('/api/v1/offers',    offersRoutes)
app.route('/api/v1/diagnosis', diagnosisRoutes)
app.route('/api/v1/reports',   reportsRoutes)
app.route('/api/v1/generate',  generateRoutes)
app.route('/api/v1/asp',       aspRoutes)
app.route('/api/v1/billing',   billingRoutes)
app.route('/api/v1/public',    publicRoutes)

// OpenAPI 3.0 spec — AI エージェント・MCP クライアント向け
app.get('/api/v1/openapi.json', (c) => c.json({
  openapi: '3.0.0',
  info: {
    title: 'AffiBase API',
    version: '1.0.0',
    description: 'AffiBase — AIが全自動でアフィリエイトサイトを生成するSaaSのAPI。テーマ選択・サイト生成・ASP案件管理・収益レポートを提供。',
    contact: { url: 'https://affihub.jp' },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Development' },
    { url: 'https://api.affihub.jp', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/api/v1/themes': {
      get: {
        summary: 'テーマ一覧',
        description: '利用可能なアフィリエイトサイトテーマの一覧を取得します。認証不要。',
        tags: ['themes'],
        responses: {
          '200': { description: 'テーマ一覧', content: { 'application/json': { schema: { type: 'object', properties: { themes: { type: 'array' } } } } } },
        },
      },
    },
    '/api/v1/offers': {
      get: {
        summary: '案件一覧',
        description: '利用可能なアフィリエイト案件を取得します。genre/aspでフィルタ可能。認証不要。',
        tags: ['offers'],
        parameters: [
          { name: 'genre', in: 'query', schema: { type: 'string' }, description: 'ジャンル例: 転職, 副業, AIツール' },
          { name: 'asp',   in: 'query', schema: { type: 'string' }, description: 'ASP名例: a8, accesstrade' },
        ],
        responses: { '200': { description: '案件一覧' } },
      },
    },
    '/api/v1/diagnosis': {
      post: {
        summary: '診断実行',
        description: 'ユーザーの回答に基づいて診断を実行し、おすすめサービスを返します。認証不要。',
        tags: ['diagnosis'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['theme_id', 'answers'], properties: { theme_id: { type: 'string', format: 'uuid' }, answers: { type: 'object' } } } } },
        },
        responses: { '200': { description: '診断結果' } },
      },
    },
    '/api/v1/sites': {
      get: {
        summary: 'マイサイト一覧',
        description: '認証ユーザーのサイト一覧を取得します。',
        tags: ['sites'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'サイト一覧' } },
      },
      post: {
        summary: 'サイト作成・AI生成開始',
        description: '新しいサイトを作成し、AI記事生成を非同期で開始します。Freeプランは1件まで。',
        tags: ['sites'],
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['theme_id', 'subdomain'], properties: { theme_id: { type: 'string', format: 'uuid' }, subdomain: { type: 'string', pattern: '^[a-z0-9-]+$' }, site_config: { type: 'object' } } } } } },
        responses: { '201': { description: 'サイト作成成功' }, '403': { description: 'Freeプラン上限' } },
      },
    },
    '/api/v1/reports/summary': {
      get: {
        summary: '収益サマリー',
        description: '過去N日間の収益・PV・サイト情報を取得します。',
        tags: ['reports'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }],
        responses: { '200': { description: '収益サマリー' } },
      },
    },
    '/api/v1/asp/sync/offers': {
      post: { summary: 'ASP案件同期', description: 'A8.net・AccessTradeから案件情報を同期します。', tags: ['asp'], security: [{ bearerAuth: [] }], responses: { '200': { description: '同期結果' } } },
    },
    '/api/v1/billing/plan': {
      get: { summary: '現在のプラン', description: '認証ユーザーのプラン情報・制限を取得します。', tags: ['billing'], security: [{ bearerAuth: [] }], responses: { '200': { description: 'プラン情報' } } },
    },
    '/api/v1/billing/checkout': {
      post: { summary: 'チェックアウトセッション作成', description: 'Proプランへのアップグレード用Stripeチェックアウトセッションを作成します。', tags: ['billing'], security: [{ bearerAuth: [] }], responses: { '200': { description: 'チェックアウトURL' } } },
    },
  },
}))

const port = Number(process.env.PORT ?? 3001)
console.log(`AffiBase API listening on port ${port}`)

serve({ fetch: app.fetch, port })

export default app
