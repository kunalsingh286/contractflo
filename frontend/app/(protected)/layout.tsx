'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, AlertTriangle, ListTodo,
  Search, Settings, ShieldAlert, LogOut, Menu, X, Plus,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Repository', href: '/contracts', icon: FileText },
  { name: 'Global Search', href: '/search', icon: Search },
  { name: 'Risk Radar', href: '/risks', icon: ShieldAlert },
  { name: 'Obligations', href: '/obligations', icon: ListTodo },
]

function UserAvatar({ name, email }: { name?: string; email?: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.slice(0, 2).toUpperCase() || 'U'

  const colors = [
    'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
    'bg-rose-600', 'bg-amber-600', 'bg-cyan-600',
  ]
  const color = colors[(email?.charCodeAt(0) || 0) % colors.length]

  return (
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {initials}
    </div>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          email: data.user.email,
        })
      }
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast('info', 'Signed out successfully')
    router.push('/login')
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const orgName = user?.email?.split('@')[1]?.split('.')[0]
    ? user.email.split('@')[1].split('.')[0].charAt(0).toUpperCase() +
      user.email.split('@')[1].split('.')[0].slice(1) + "'s Workspace"
    : 'My Workspace'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-neutral-800/80">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            ContractFlo
          </span>
        </Link>
      </div>

      {/* Upload Button */}
      <div className="px-3 pt-4 pb-2">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm h-9 rounded-lg shadow-sm transition-colors"
          asChild
        >
          <Link href="/contracts/upload" onClick={() => setMobileMenuOpen(false)}>
            <Plus className="w-4 h-4 mr-2" /> New Contract
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-3 py-2">
          Platform
        </p>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
              }`}
            >
              <link.icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-blue-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
              {link.name}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-500/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-3 pb-3 border-t border-neutral-800/80 pt-3 space-y-0.5">
        <Link
          href="/organization"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors group ${
            pathname.startsWith('/organization')
              ? 'bg-blue-600/15 text-blue-400 font-medium'
              : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
          }`}
        >
          <Settings className="w-4 h-4 mr-3 shrink-0 text-neutral-500 group-hover:text-neutral-300" />
          Settings
        </Link>

        {/* User Card */}
        <div className="mt-2 px-2 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800/60 flex items-center gap-2.5">
          <UserAvatar name={user?.name} email={user?.email} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-200 truncate">{displayName}</p>
            <p className="text-[10px] text-neutral-500 truncate">{orgName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 bg-neutral-950 border-r border-neutral-800/80 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 bg-neutral-950 border-r border-neutral-800 flex flex-col md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-56 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-12 px-4 bg-neutral-950 border-b border-neutral-800 sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white">ContractFlo</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
