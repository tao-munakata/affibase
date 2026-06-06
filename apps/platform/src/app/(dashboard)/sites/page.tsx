'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Globe, Plus, ExternalLink, Clock, CheckCircle, AlertCircle, PauseCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface Site {
  id: string
  subdomain: string
  status: string
  theme_name: string
  theme_genre: string
  created_at: string
  published_at: string | null
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'active')     return <CheckCircle className="w-4 h-4 text-green-500" />
  if (status === 'generating') return <Clock className="w-4 h-4 text-yellow-500" />
  if (status === 'paused')     return <PauseCircle className="w-4 h-4 text-gray-400" />
  return <AlertCircle className="w-4 h-4 text-red-500" />
}

const statusLabel: Record<string, string> = {
  active: '公開中',
  generating: '生成中',
  paused: '停止中',
  error: 'エラー',
}

export default function SitesPage() {
  const { data, isLoading } = useSWR('/api/v1/sites', (url) =>
    api.get<{ sites: Site[] }>(url)
  )
  const sites = data?.sites ?? []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">マイサイト</h1>
          <p className="text-gray-500 mt-1">あなたのアフィリエイトサイト一覧</p>
        </div>
        <Link href="/themes" className="btn-primary">
          <Plus className="w-4 h-4" /> 新しいサイト
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="card p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">まだサイトがありません</h2>
          <p className="text-gray-500 mb-6 text-sm">テーマを選んでサイトを作成しましょう</p>
          <Link href="/themes" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> サイトを作成
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <div key={site.id} className="card p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon status={site.status} />
                  <a
                    href={`https://${site.subdomain}.affibase.jp`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-brand-600 flex items-center gap-1"
                  >
                    {site.subdomain}.affibase.jp
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-sm text-gray-500">
                  {site.theme_name} · {site.theme_genre}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={clsx(
                  'badge',
                  site.status === 'active'     ? 'bg-green-100 text-green-700' :
                  site.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                  site.status === 'paused'     ? 'bg-gray-100 text-gray-600' :
                                                 'bg-red-100 text-red-700'
                )}>
                  {statusLabel[site.status] ?? site.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(site.created_at).toLocaleDateString('ja-JP')}作成
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
