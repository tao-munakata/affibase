'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { clsx } from 'clsx'
import { TrendingUp, Users, Star, ArrowRight, Search } from 'lucide-react'

interface Theme {
  id: string
  name: string
  slug: string
  description: string
  genre: string
  monthly_searches: number | null
  competition_level: string | null
  avg_affiliate_price: number | null
  aeo_potential: string | null
  difficulty_score: number | null
}

const GENRES = ['すべて', '副業', '転職', 'AIツール', 'オンライン学習', '投資']

const competitionLabel: Record<string, string> = {
  low: '低競合',
  medium: '中競合',
  high: '高競合',
}
const competitionColor: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}
const aeoColor: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-gray-400',
}

export default function ThemesPage() {
  const router = useRouter()
  const [genre, setGenre] = useState('すべて')
  const [search, setSearch] = useState('')

  const url = genre === 'すべて'
    ? '/api/v1/themes'
    : `/api/v1/themes?genre=${encodeURIComponent(genre)}`

  const { data, isLoading } = useSWR(url, (u) => api.get<{ themes: Theme[] }>(u))
  const themes = (data?.themes ?? []).filter((t) =>
    search === '' || t.name.includes(search) || t.description?.includes(search)
  )

  const select = (theme: Theme) => {
    router.push(`/sites/new?theme_id=${theme.id}&theme_name=${encodeURIComponent(theme.name)}`)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">テーマを選ぶ</h1>
        <p className="text-gray-500 mt-1">月間検索数・競合難度・案件単価を参考に選んでください</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="テーマを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                genre === g
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div key={theme.id} className="card p-6 hover:border-brand-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge bg-blue-50 text-blue-700 text-xs mb-2">{theme.genre}</span>
                  <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                </div>
                {theme.competition_level && (
                  <span className={clsx('badge text-xs', competitionColor[theme.competition_level])}>
                    {competitionLabel[theme.competition_level]}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{theme.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div>
                  <p className="text-xs text-gray-400">月間検索</p>
                  <p className="text-sm font-semibold">
                    {theme.monthly_searches ? `${(theme.monthly_searches / 10000).toFixed(0)}万` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">平均単価</p>
                  <p className="text-sm font-semibold">
                    {theme.avg_affiliate_price ? `¥${theme.avg_affiliate_price.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">AI引用性</p>
                  <p className={clsx('text-sm font-semibold', aeoColor[theme.aeo_potential ?? 'low'])}>
                    {theme.aeo_potential === 'high' ? '高' : theme.aeo_potential === 'medium' ? '中' : '低'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => select(theme)}
                className="btn-primary w-full group-hover:bg-brand-700"
              >
                このテーマで作成 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
