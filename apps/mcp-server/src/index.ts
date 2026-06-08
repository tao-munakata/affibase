#!/usr/bin/env node
/**
 * AffiBase MCP Server
 * AI エージェントがAffiBaseのテーマ・案件・サイト情報にアクセスするためのMCPサーバー
 *
 * 起動方法:
 *   AFFIBASE_API_URL=http://localhost:3001 npx tsx src/index.ts
 *
 * Claude Desktop設定 (~/.claude/mcp.json または .mcp.json):
 *   {
 *     "mcpServers": {
 *       "affibase": {
 *         "command": "npx",
 *         "args": ["tsx", "/path/to/affibase/apps/mcp-server/src/index.ts"],
 *         "env": {
 *           "AFFIBASE_API_URL": "http://localhost:3001",
 *           "AFFIBASE_TOKEN": "<your-jwt-token>"
 *         }
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_URL = process.env.AFFIBASE_API_URL ?? 'http://localhost:3001'
const TOKEN   = process.env.AFFIBASE_TOKEN ?? ''

// ── API helper ──────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers: { ...headers, ...opts?.headers as Record<string, string> } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AffiBase API ${res.status}: ${err}`)
  }
  return res.json()
}

function toText(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

// ── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'affibase',
  version: '1.0.0',
})

// ── Tools ────────────────────────────────────────────────────────────────────

server.tool(
  'list_themes',
  'AffiBaseで利用可能なアフィリエイトサイトテーマの一覧を取得します。ジャンル・月間検索数・AEOポテンシャルなどを確認できます。',
  {},
  async () => {
    const data = await apiFetch('/api/v1/themes') as { themes: unknown[] }
    return {
      content: [{ type: 'text' as const, text: toText(data.themes) }],
    }
  }
)

server.tool(
  'list_offers',
  '利用可能なアフィリエイト案件の一覧を取得します。ジャンルやASP（A8.net/AccessTrade等）でフィルタリングできます。',
  {
    genre: z.string().optional().describe('ジャンル例: 転職, 副業, AIツール, オンライン学習'),
    asp:   z.string().optional().describe('ASP名例: a8, accesstrade, valuecommerce'),
  },
  async ({ genre, asp }) => {
    const params = new URLSearchParams()
    if (genre) params.set('genre', genre)
    if (asp)   params.set('asp', asp)
    const qs = params.toString() ? `?${params}` : ''
    const data = await apiFetch(`/api/v1/offers${qs}`) as { offers: unknown[] }
    return {
      content: [{ type: 'text' as const, text: toText(data.offers) }],
    }
  }
)

server.tool(
  'run_diagnosis',
  '診断ツールを実行して、ユーザーの回答に基づいたアフィリエイトサービスの推薦結果を取得します。',
  {
    theme_id: z.string().uuid().describe('テーマID（list_themesで取得）'),
    answers:  z.record(z.string()).describe('質問への回答マップ例: {"job": "office", "time": "1h", "goal": "30k"}'),
  },
  async ({ theme_id, answers }) => {
    const data = await apiFetch('/api/v1/diagnosis', {
      method: 'POST',
      body: JSON.stringify({ theme_id, answers }),
    })
    return {
      content: [{ type: 'text' as const, text: toText(data) }],
    }
  }
)

server.tool(
  'get_site_info',
  '指定サイトの情報（ステータス・生成記事・ジョブ履歴）を取得します。AFFIBASE_TOKEN が必要です。',
  {
    site_id: z.string().uuid().describe('サイトID'),
  },
  async ({ site_id }) => {
    if (!TOKEN) throw new Error('AFFIBASE_TOKEN が設定されていません')
    const data = await apiFetch(`/api/v1/sites/${site_id}`) as {
      site: { subdomain: string; status: string }
      articles: unknown[]
      jobs: unknown[]
    }
    const summary = {
      subdomain:    data.site.subdomain,
      status:       data.site.status,
      article_count: (data.articles as unknown[]).length,
      articles:     data.articles,
      recent_jobs:  data.jobs,
    }
    return {
      content: [{ type: 'text' as const, text: toText(summary) }],
    }
  }
)

server.tool(
  'get_revenue_summary',
  '収益サマリーと日別推移データを取得します。AFFIBASE_TOKEN が必要です。',
  {
    days: z.number().int().min(1).max(90).optional().default(30).describe('集計日数（デフォルト30日）'),
  },
  async ({ days }) => {
    if (!TOKEN) throw new Error('AFFIBASE_TOKEN が設定されていません')
    const data = await apiFetch(`/api/v1/reports/summary?days=${days}`)
    return {
      content: [{ type: 'text' as const, text: toText(data) }],
    }
  }
)

// ── Resources ────────────────────────────────────────────────────────────────

server.resource(
  'affibase-themes',
  'affibase://themes',
  { mimeType: 'application/json', description: 'AffiBase テーマ一覧' },
  async () => {
    const data = await apiFetch('/api/v1/themes') as { themes: unknown[] }
    return {
      contents: [{
        uri:      'affibase://themes',
        mimeType: 'application/json',
        text:     toText(data.themes),
      }],
    }
  }
)

server.resource(
  'affibase-offers',
  'affibase://offers',
  { mimeType: 'application/json', description: 'AffiBase アフィリエイト案件一覧' },
  async () => {
    const data = await apiFetch('/api/v1/offers') as { offers: unknown[] }
    return {
      contents: [{
        uri:      'affibase://offers',
        mimeType: 'application/json',
        text:     toText(data.offers),
      }],
    }
  }
)

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
