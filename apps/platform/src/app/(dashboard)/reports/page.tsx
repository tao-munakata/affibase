'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Globe, Zap, FileCheck } from 'lucide-react'

interface Summary {
  total_pv: number
  total_affiliate_revenue: string
  total_conversions: number
  total_ai_citations: number
}

interface DailyData {
  report_date: string
  pv: string
  revenue: string
}

function MetricCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-brand-50 rounded-lg">
          <Icon className="w-4 h-4 text-brand-600" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const { data, isLoading } = useSWR('/api/v1/reports/summary?days=30', (url) =>
    api.get<{ summary: Summary | null; daily: DailyData[] }>(url)
  )

  const summary = data?.summary
  const daily = (data?.daily ?? []).map((d) => ({
    date: d.report_date.slice(5),
    収益: Number(d.revenue),
    PV: Number(d.pv),
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">収益レポート</h1>
        <p className="text-gray-500 mt-1">過去30日間のパフォーマンス</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={TrendingUp}
          label="アフィリ収益"
          value={summary ? `¥${Number(summary.total_affiliate_revenue).toLocaleString()}` : '—'}
          sub="過去30日"
        />
        <MetricCard
          icon={Globe}
          label="ページビュー"
          value={summary ? summary.total_pv.toLocaleString() : '—'}
          sub="過去30日"
        />
        <MetricCard
          icon={FileCheck}
          label="成約件数"
          value={summary ? summary.total_conversions.toLocaleString() : '—'}
          sub="アフィリエイト"
        />
        <MetricCard
          icon={Zap}
          label="AI引用数"
          value={summary ? summary.total_ai_citations.toLocaleString() : '—'}
          sub="AEO計測"
        />
      </div>

      {daily.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">収益推移</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="収益" stroke="#0ea5e9" fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">PV推移</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="PV" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500 text-sm">まだレポートデータがありません。サイトを公開するとデータが蓄積されます。</p>
        </div>
      )}
    </div>
  )
}
