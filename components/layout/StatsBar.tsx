'use client'

interface StatsBarProps {
  total: number
  p1: number
  inProgress: number
  blocked: number
  overdue: number
  claudeQueue: number
}

export function StatsBar({ total, p1, inProgress, blocked, overdue, claudeQueue }: StatsBarProps) {
  const stats = [
    { n: total,       label: 'Open Tasks',       sub: 'active',         color: 'var(--ink)' },
    { n: p1,          label: 'P1 Critical',       sub: 'need today',     color: 'var(--p1)' },
    { n: inProgress,  label: 'In Progress',       sub: 'being worked',   color: 'var(--blue)' },
    { n: blocked,     label: 'Blocked',           sub: 'need attention', color: 'var(--p1)' },
    { n: overdue,     label: 'Overdue',           sub: 'past due date',  color: overdue > 0 ? 'var(--p1)' : 'var(--ink3)' },
    { n: claudeQueue, label: "Claude's Queue",    sub: 'awaiting AI',    color: 'var(--purple)' },
  ]

  return (
    <div
      className="flex flex-shrink-0 sticky z-40"
      style={{ top: 56, borderBottom: '1px solid var(--line)', background: 'var(--plate)' }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex-1 flex items-center gap-2.5 px-4 py-2.5"
          style={{ borderRight: i < stats.length - 1 ? '1px solid var(--line)' : 'none' }}
        >
          <div>
            <div className="font-display text-3xl leading-none" style={{ color: s.color }}>{s.n}</div>
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--ink2)' }}>{s.label}</div>
            <div className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
