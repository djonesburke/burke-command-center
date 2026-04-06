'use client'

import { formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import type { TaskWithProject } from '@/lib/types'

interface TaskCardProps {
  task: TaskWithProject
  onClick: () => void
  onStatusChange: (status: string) => void
  onToggleDone: () => void
  onArchive?: () => void
}

const STATUS_OPTIONS = ['todo', 'inprogress', 'blocked', 'waiting', 'done']

export function TaskCard({ task, onClick, onStatusChange, onToggleDone, onArchive }: TaskCardProps) {
  const isDone   = task.status === 'done'
  const isOverdue = task.dueDate && !isDone && isPast(new Date(task.dueDate))
  const isStale  = !isDone && !task.updatedAt ? false
    : !isDone && (Date.now() - new Date(task.updatedAt).getTime()) > 7 * 24 * 60 * 60 * 1000

  return (
    <div
      className={`card card-stripe ${task.priority} p-3 ${isOverdue ? 'border-red-500/40' : ''}`}
      onClick={onClick}
    >
      {isStale && (
        <span
          className="absolute top-2 right-2 font-mono text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-sm"
          style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.4)' }}
        >
          STALE
        </span>
      )}

      {/* Title row */}
      <div className="flex items-start gap-2 mb-2">
        <button
          className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-sm border flex items-center justify-center transition-all"
          style={{
            borderColor: isDone ? 'var(--p3)' : 'var(--line2)',
            background: isDone ? 'var(--p3)' : 'transparent',
          }}
          onClick={e => { e.stopPropagation(); onToggleDone() }}
        >
          {isDone && <span style={{ color: '#0C0E12', fontSize: 9, fontWeight: 900 }}>✓</span>}
        </button>
        <p
          className="text-sm font-medium leading-snug flex-1"
          style={{
            color: isDone ? 'var(--ink3)' : 'var(--ink)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant={task.priority}>{task.priority.toUpperCase()}</Badge>
        <Badge variant={task.type}>{task.type}</Badge>
        {task.claudeQueue && <Badge variant="claude">→ CLAUDE</Badge>}
        {isOverdue && <Badge variant="overdue">OVERDUE</Badge>}
        <span
          className="tag"
          style={{ background: 'transparent', color: 'var(--ink3)', border: '1px solid var(--line)' }}
        >
          {task.project.name}
        </span>
      </div>

      {/* Next action */}
      {task.nextAction && (
        <div className="mb-2 rounded px-2 py-1.5" style={{ background: 'var(--bg)', borderLeft: '2px solid var(--line2)' }}>
          <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--ink3)' }}>Next</p>
          <p className="text-xs leading-snug" style={{ color: 'var(--ink2)' }}>{task.nextAction}</p>
        </div>
      )}

      {/* Notes snippet */}
      {task.notes && !task.nextAction && (
        <p className="font-mono text-[10px] italic mb-1.5 leading-snug line-clamp-2" style={{ color: 'var(--ink3)' }}>
          {task.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
          {task.owner ?? 'Unassigned'}
        </span>
        {task.dueDate && (
          <span
            className="font-mono text-[10px]"
            style={{ color: isOverdue ? 'var(--p1)' : 'var(--ink3)', fontWeight: isOverdue ? 700 : 400 }}
          >
            {isOverdue ? '⚠ ' : ''}
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Move buttons */}
      <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
        {STATUS_OPTIONS.filter(s => s !== task.status).map(s => (
          <button
            key={s}
            className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm border uppercase tracking-wider transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--ink3)' }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.color = 'var(--gold)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'var(--line)'
              e.currentTarget.style.color = 'var(--ink3)'
            }}
            onClick={() => onStatusChange(s)}
          >
            {s === 'inprogress' ? 'WIP' : s}
          </button>
        ))}
        {isDone && onArchive && (
          <button
            className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm border uppercase tracking-wider transition-all"
            style={{ borderColor: 'rgba(167,139,250,.3)', color: 'var(--purple)' }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(167,139,250,.1)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent'
            }}
            onClick={onArchive}
          >
            archive
          </button>
        )}
      </div>
    </div>
  )
}
