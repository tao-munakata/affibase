'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { api } from '@/lib/api'
import { CheckCircle, Zap, Crown, AlertCircle } from 'lucide-react'

interface PlanInfo {
  plan: string
  mock_mode: boolean
  limits: { max_sites: number | null; label: string; price_jpy: number }
}

const PRO_FEATURES = [
  'サイト無制限作成',
  'AI記事生成（月100本/サイト）',
  'AEO対応（llms.txt自動生成）',
  'ASP案件自動同期',
  'レポート分析（30日）',
  '優先サポート',
]

const FREE_FEATURES = [
  'サイト1件まで',
  'AI記事生成（5本/サイト）',
  'AEO対応',
  'サポート（コミュニティ）',
]

export default function BillingPage() {
  const { data, isLoading, mutate } = useSWR<PlanInfo>('/api/v1/billing/plan', (url: string) => api.get<PlanInfo>(url))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isPro = data?.plan === 'pro'

  const handleUpgrade = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post<{ mock?: boolean; url?: string; plan?: string; upgraded?: boolean }>('/api/v1/billing/checkout', {})
      if (res.mock) {
        setMessage('テストモード：Proプランに変更しました')
        await mutate()
      } else if (res.url) {
        window.location.href = res.url
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDowngrade = async () => {
    if (!confirm('Freeプランに戻しますか？（テストモード）')) return
    setLoading(true)
    try {
      await api.post<{ plan: string }>('/api/v1/billing/mock-upgrade', {})
      setMessage('Freeプランに変更しました')
      await mutate()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handlePortal = async () => {
    setLoading(true)
    try {
      const res = await api.post<{ url?: string; mock?: boolean; message?: string }>('/api/v1/billing/portal', {})
      if (res.url) {
        window.location.href = res.url
      } else {
        setMessage(res.message ?? 'ポータルを開けませんでした')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">プラン・請求</h1>
        <p className="text-gray-500 mt-1 text-sm">現在のプランと料金の確認・変更ができます</p>
        {data?.mock_mode && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            テストモード（Stripe未設定）— 実際の課金は発生しません
          </div>
        )}
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-2 text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      {/* 現在のプラン */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">現在のプラン</h2>
          <span className={`badge ${isPro ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>
        <div className="text-3xl font-bold mb-1">
          {isPro ? '¥2,980' : '¥0'}<span className="text-sm font-normal text-gray-500">/月</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {isPro ? 'サイト無制限・全機能利用可能' : 'サイト1件まで・基本機能のみ'}
        </p>
        {isPro && (
          <button
            onClick={data?.mock_mode ? handleDowngrade : handlePortal}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {data?.mock_mode ? 'Freeに戻す（テスト）' : 'サブスクリプション管理'}
          </button>
        )}
      </div>

      {/* プラン比較 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div className={`card p-6 ${!isPro ? 'ring-2 ring-brand-500' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-gray-700">Free</span>
            {!isPro && <span className="text-xs text-brand-600 font-medium">現在のプラン</span>}
          </div>
          <div className="text-2xl font-bold mb-4">¥0<span className="text-sm font-normal text-gray-500">/月</span></div>
          <ul className="space-y-2 text-sm text-gray-600">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`card p-6 ${isPro ? 'ring-2 ring-brand-500' : 'border-brand-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-brand-700">Pro</span>
            {isPro && <span className="text-xs text-brand-600 font-medium">現在のプラン</span>}
          </div>
          <div className="text-2xl font-bold text-brand-600 mb-4">¥2,980<span className="text-sm font-normal text-gray-500">/月</span></div>
          <ul className="space-y-2 text-sm text-gray-600 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="btn-primary w-full"
            >
              <Crown className="w-4 h-4" />
              {loading ? '処理中...' : data?.mock_mode ? 'Proに変更（テスト）' : 'Proにアップグレード'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
