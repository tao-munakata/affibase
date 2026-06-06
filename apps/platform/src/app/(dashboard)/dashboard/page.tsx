'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { TrendingUp, Globe, FileText, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Summary {
  total_pv: number
  total_affiliate_revenue: string
  total_conversions: number
  total_ai_citations: number
}

interface DailyData {
  report_date: string
  pv: number
  revenue: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'brand',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useSWR('/api/v1/reports/summary', (url) =>
    api.get<{ summary: Summary | null; daily: DailyData[]; sites: { id: string; subdomain: string; status: string }[] }>(url)
  )

  const summary = data?.summary
  const sites = data?.sites ?? []
  const daily = data?.daily ?? []

  const chartData = daily.map((d) => ({
    date: d.report_date.slice(5),
    収益: Number(d.revenue),
    PV: d.pv,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          おかえりなさい、{user?.name ?? 'ゲスト'}さん 👋
        </h1>
        <p className="text-gray-500 mt-1">過去30日間のパフォーマンスです</p>
      </div>

      {sites.length === 0 ? (
        <div className="card p-12 text-center">
          <Zap className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">サイトを作成しましょう</h2>
          <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
            テーマを選んでボタンを押すだけ。AIが診断サイト＋記事100本を自動生成します。
          </p>
          <Link href="/themes" className="btn-primary inline-flex">
            テーマを選ぶ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={TrendingUp} label="月間収益（円）"   value={summary ? `¥${Number(summary.total_affiliate_revenue).toLocaleString()}` : '—'} />
            <StatCard icon={Globe}      label="ページビュー"     value={summary ? summary.total_pv.toLocaleString() : '—'} color="green" />
            <StatCard icon={FileText}   label="アフィリ成約"     value={summary ? summary.total_conversions.toLocaleString() : '—'} color="purple" />
            <StatCard icon={Zap}        label="AI引用回数"       value={summary ? summary.total_ai_citations.toLocaleString() : '—'} color="yellow" />
          </div>

          {chartData.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-base font-semibold mb-4">収益 / PV 推移（30日間）</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="収益" stroke="#0ea5e9" fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">マイサイト</h2>
              <Link href="/sites" className="text-sm text-brand-600 hover:underline">すべて見る</Link>
            </div>
            <div className="space-y-3">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{site.subdomain}.affibase.jp</p>
                  </div>
                  <span className={`badge ${site.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {site.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
