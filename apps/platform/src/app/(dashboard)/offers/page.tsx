'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { clsx } from 'clsx'
import { ExternalLink, TrendingUp } from 'lucide-react'

interface Offer {
  id: string
  asp: string
  name: string
  description: string | null
  genre: string
  commission: number | null
  approval_rate: number | null
  epc: number | null
  product_url: string | null
  status: string
}

const GENRES = ['すべて', '副業', '転職', 'AIツール', 'オンライン学習']

export default function OffersPage() {
  const [genre, setGenre] = useState('すべて')

  const url = genre === 'すべて'
    ? '/api/v1/offers'
    : `/api/v1/offers?genre=${encodeURIComponent(genre)}`

  const { data, isLoading } = useSWR(url, (u) => api.get<{ offers: Offer[] }>(u))
  const offers = data?.offers ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">案件管理</h1>
        <p className="text-gray-500 mt-1">利用可能なアフィリエイト案件一覧</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
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

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">案件名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ジャンル</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ASP</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">報酬単価</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">承認率</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">EPC</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{offer.name}</p>
                      {offer.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{offer.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-blue-50 text-blue-700">{offer.genre}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 uppercase text-xs font-mono">{offer.asp}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {offer.commission ? `¥${offer.commission.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx(
                        'font-medium',
                        (offer.approval_rate ?? 0) >= 75 ? 'text-green-600' : 'text-yellow-600'
                      )}>
                        {offer.approval_rate ? `${offer.approval_rate}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {offer.epc ? `¥${offer.epc}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {offer.product_url && (
                        <a
                          href={offer.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
