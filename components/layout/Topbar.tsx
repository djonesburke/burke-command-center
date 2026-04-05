'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { clsx } from 'clsx'

const NAV = [
  { href: '/dashboard',     label: 'KANBAN'       },
  { href: '/projects',      label: 'PROJECTS'     },
  { href: '/brain-dump',    label: 'BRAIN DUMP'   },
  { href: '/improvements',  label: 'IMPROVEMENTS' },
  { href: '/audit-log',     label: 'AUDIT LOG'    },
]

interface TopbarProps {
  onNewTask: () => void
  onNewProject: () => void
  syncStatus?: 'idle' | 'saving' | 'saved' | 'error'
}

export function Topbar({ onNewTask, onNewProject, syncStatus = 'idle' }: TopbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const syncLabel = { idle: '● live', saving: '● saving…', saved: '● saved', error: '● error' }[syncStatus]
  const syncColor = {
    idle:   'var(--ink3)',
    saving: 'var(--gold)',
    saved:  'var(--p3)',
    error:  'var(--p1)',
  }[syncStatus]

  return (
    <header
      className="flex items-center justify-between px-5 flex-shrink-0 sticky top-0 z-50"
      style={{ height: 56, background: 'var(--plate)', borderBottom: '1px solid var(--line)' }}
    >
      {/* Wordmark */}
      <div className="font-display text-xl tracking-widest" style={{ color: 'var(--gold)' }}>
        BURKE TRUCK{' '}
        <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--ink3)' }}>
          // CEO OPS
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-0.5">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'font-mono text-[10px] px-4 py-1.5 rounded-sm border uppercase tracking-wider transition-all',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'border-burke-line2 text-burke-gold'
                : 'border-transparent text-burke-ink3 hover:text-burke-ink hover:border-burke-line2'
            )}
            style={
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? { background: 'var(--raised)' }
                : {}
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px]" style={{ color: syncColor }}>
          {syncLabel}
        </span>
        <button className="btn" onClick={onNewProject}>+ Project</button>
        <button className="btn-gold" onClick={onNewTask}>+ Task</button>
        <button
          className="btn text-[10px]"
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={session?.user?.email ?? 'Logout'}
        >
          {session?.user?.name?.split(' ')[0] ?? 'Logout'}
        </button>
      </div>
    </header>
  )
}
