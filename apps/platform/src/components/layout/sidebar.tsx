'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Globe, Palette, BarChart3, Briefcase, LogOut, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { clsx } from 'clsx'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/themes',    icon: Palette,         label: 'テーマ選択' },
  { href: '/sites',     icon: Globe,           label: 'マイサイト' },
  { href: '/offers',    icon: Briefcase,       label: '案件管理' },
  { href: '/reports',   icon: BarChart3,       label: '収益レポート' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-600" />
          <span className="font-bold text-lg text-brand-700">AffiBase</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 mb-2">
          <p className="text-xs font-medium text-gray-800 truncate">{user?.name ?? user?.email}</p>
          <span className={clsx(
            'badge text-xs mt-1',
            user?.plan === 'pro' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
          )}>
            {user?.plan?.toUpperCase() ?? 'FREE'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
