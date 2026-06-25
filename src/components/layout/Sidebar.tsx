'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, Globe, BarChart3, Bell,
  Settings, LogOut, Plus, FolderOpen
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'

const NAV = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/sites',     icon: Globe,           label: 'My Sites' },
  { href: '/dashboard/portfolio', icon: FolderOpen,      label: 'Portfolio' },
  { href: '/dashboard/alerts',    icon: Bell,            label: 'Alerts' },
  { href: '/dashboard/settings',  icon: Settings,        label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-teal-900 border-r border-teal-800/60 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-teal-800/60">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">SEO Intern</span>
        </Link>
      </div>

      {/* Quick action */}
      <div className="p-4">
        <Link href="/dashboard/sites/add"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full justify-center">
          <Plus className="w-4 h-4" />
          Add Site
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-teal-400 hover:text-teal-200 hover:bg-teal-800/50'
              )}>
              <Icon className={clsx('w-4 h-4 shrink-0', active ? 'text-teal-400' : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-teal-800/60">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-teal-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
