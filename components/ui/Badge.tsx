import { clsx } from 'clsx'

interface BadgeProps {
  variant: 'p1' | 'p2' | 'p3' | 'internal' | 'external' | 'odoo' | 'claude' | 'overdue' | string
  children: React.ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={clsx('tag', `tag-${variant}`)}>
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const labels: Record<string, string> = { p1: 'P1 Critical', p2: 'P2 Week', p3: 'P3 Backlog' }
  return <Badge variant={priority as 'p1' | 'p2' | 'p3'}>{labels[priority] ?? priority}</Badge>
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    todo:       'var(--ink3)',
    inprogress: 'var(--blue)',
    blocked:    'var(--p1)',
    waiting:    'var(--purple)',
    done:       'var(--p3)',
    active:     'var(--p3)',
    archived:   'var(--ink3)',
  }
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: colors[status] ?? 'var(--ink3)' }}
    />
  )
}
