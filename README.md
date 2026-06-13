設計方針を大幅に変更したので、削除します

# AffiBase — AIが全自動で資産サイトを生成するSaaSプラットフォーム

## クイックスタート

```bash
# 1. 環境変数を設定
cp .env.example .env
# .env を編集（最低限 ANTHROPIC_API_KEY を設定）

# 2. Docker で全サービス起動
docker compose up --build

# 起動後のURL
# 管理画面:    http://localhost:3000
# API:         http://localhost:3001
# 会員サイト:   http://localhost:4321
# DB:          localhost:5432
```

## サービス構成

| サービス | ポート | 説明 |
|---------|--------|------|
| platform | 3000 | Next.js 16 管理画面 |
| api | 3001 | Hono TypeScript API |
| member-site | 4321 | Astro 会員サイトテンプレート |
| postgres | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 |

## API エンドポイント（公開）

```
GET  /api/v1/offers              # 案件一覧（AI エージェント対応）
POST /api/v1/diagnosis           # 副業診断実行
GET  /api/v1/openapi.json        # OpenAPI仕様書
```

## ロードマップ

- [x] Phase 1: MVP — 管理画面・API・DB・会員サイトテンプレート
- [ ] Phase 2: AEO — llms.txt・JSON-LD・AI記事生成（ANTHROPIC_API_KEY必要）
- [ ] Phase 3: ベータ公開 — クローズドβ・ダッシュボード強化
- [ ] Phase 4: Agent対応 — OpenAPI・MCP サーバー
- [ ] Phase 5: 本公開 — Stripe課金・ASP API連携
