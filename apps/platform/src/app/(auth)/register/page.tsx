'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const schema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100),
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(8, '8文字以上で入力してください'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      const { token, user } = await api.post<{ token: string; user: { id: string; email: string; name: string | null; plan: string } }>(
        '/api/v1/auth/register',
        data
      )
      login(token, user)
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'Email already registered') {
        setError('このメールアドレスはすでに登録されています')
      } else {
        setError('登録に失敗しました')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-700">AffiBase</h1>
          <p className="text-gray-500 mt-1 text-sm">無料で始める</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label">お名前（ニックネーム可）</label>
            <input type="text" {...register('name')} className="input" placeholder="山田 太郎" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">メールアドレス</label>
            <input type="email" {...register('email')} className="input" placeholder="your@email.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">パスワード（8文字以上）</label>
            <input type="password" {...register('password')} className="input" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
            {isSubmitting ? '登録中...' : '無料で登録'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          登録することで利用規約とプライバシーポリシーに同意したとみなします
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
