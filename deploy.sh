#!/bin/bash
# AffiBase VPS デプロイスクリプト
# 使い方: ./deploy.sh [--pull]  (--pull でリモートから git pull してからビルド)
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -f docker-compose.prod.yml"

cd "$APP_DIR"

# .env が存在するか確認
if [ ! -f .env ]; then
  echo "ERROR: .env が見つかりません。.env.production.example をコピーして設定してください。"
  exit 1
fi

# git pull (--pull オプション時)
if [[ "${1:-}" == "--pull" ]]; then
  echo ">>> git pull"
  git pull --ff-only
fi

echo ">>> Docker イメージをビルド"
$COMPOSE build --pull

echo ">>> 旧コンテナを停止・新コンテナ起動（ダウンタイム最小化）"
$COMPOSE up -d --remove-orphans

echo ">>> DBマイグレーション（初回のみ自動適用済み）"
# 追加マイグレーションがある場合はここで実行:
# $COMPOSE exec -T api node dist/scripts/migrate.js

echo ">>> ヘルスチェック"
sleep 5
curl -sf http://localhost/health 2>/dev/null && echo " platform OK" || echo " platform WARN"
curl -sf http://localhost:3001/health 2>/dev/null && echo " api OK" || echo " api WARN (internal only)"

echo ">>> 古いイメージを削除"
docker image prune -f

echo ">>> デプロイ完了"
$COMPOSE ps
