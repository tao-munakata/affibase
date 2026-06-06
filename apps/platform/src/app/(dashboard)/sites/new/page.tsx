'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Zap } from 'lucide-react'

const schema = z.object({
  subdomain: z
    .string()
    .min(3, '3文字以上')
    .max(50, '50文字以内')
    .regex(/^[a-z0-9-]+$/, '小文字英数字とハイフンのみ使用可'),
  operator_name: z.string().min(1, '必須').max(100),
  operator_bio: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

function NewSiteForm() {
  const router = useRouter()
  const params = useSearchParams()
  const themeId = params.get('theme_id') ?? ''
  const themeName = params.get('theme_name') ?? ''
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      await api.post('/api/v1/sites', {
        theme_id: themeId,
        subdomain: data.subdomain,
        site_config: {
          operator_name: data.operator_name,
          operator_bio: data.operator_bio,
        },
      })
      router.push('/sites')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サイト作成に失敗しました')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-brand-600 font-medium mb-1">テーマ: {themeName}</p>
        <h1 className="text-2xl font-bold text-gray-900">サイトを作成</h1>
        <p className="text-gray-500 mt-1 text-sm">設定後にAIが自動生成を開始します（24〜48時間）</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div>
          <label className="label">サブドメイン</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              {...register('subdomain')}
              className="input flex-1"
              placeholder="my-affiliate-site"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">.affibase.jp</span>
          </div>
          {errors.subdomain && <p className="text-red-500 text-xs mt-1">{errors.subdomain.message}</p>}
        </div>

        <div>
          <label className="label">運営者名</label>
          <input
            type="text"
            {...register('operator_name')}
            className="input"
            placeholder="例：田中 花子（E-E-A-T対応で重要）"
          />
          {errors.operator_name && <p className="text-red-500 text-xs mt-1">{errors.operator_name.message}</p>}
        </div>

        <div>
          <label className="label">運営者プロフィール（任意）</label>
          <textarea
            {...register('operator_bio')}
            className="input h-24 resize-none"
            placeholder="例：会社員歴10年。副業で月収10万円を達成。AIツールを駆使した効率的な副業術を発信中。"
          />
          <p className="text-xs text-gray-400 mt-1">AIに引用されやすいE-E-A-T（専門性・経験・権威性・信頼性）に影響します</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting || !themeId} className="btn-primary w-full">
          <Zap className="w-4 h-4" />
          {isSubmitting ? 'サイト生成を開始中...' : 'AIサイト生成を開始'}
        </button>
      </form>
    </div>
  )
}

export default function NewSitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">読み込み中...</div>}>
      <NewSiteForm />
    </Suspense>
  )
}
