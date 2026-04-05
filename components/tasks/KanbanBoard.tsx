'use client'

import { TaskCard } from './TaskCard'
import type { TaskWithProject } from '@/lib/types'

const COLUMNS = [
  { id: 'todo',       label: 'To Do',       color: 'var(--blue)'   },
  { id: 'inprogress', label: 'In Progress',  color: 'var(--p2)'    },
  { id: 'blocked',    label: 'Blocked',      color: 'var(--p1)'    },
  { id: 'waiting',    label: 'Waiting',      color: 'var(--purple)' },
  { id: 'done',       label: 'Done',         color: 'var(--p3)'    },
]

interface KanbanBoardProps {
  tasks: TaskWithProject[]
  onTaskClick: (task: TaskWithProject) => void
  onStatusChange: (taskId: string, status: string) => void
  onToggleDone: (taskId: string) => void
}

export function KanbanBoard({ tasks, onTaskClick, onStatusChange, onToggleDone }: KanbanBoardProps) {
  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-visible flex gap-2.5 p-3 items-start"
      style={{ minWidth: 0 }}
    >
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        return (
          <div key={col.id} className="flex-shrink-0 flex flex-col" style={{ width: 288 }}>
            {/* Column header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-t border border-b-0"
              style={{ background: 'var(--raised)', borderColor: 'var(--line)' }}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: col.color }}>
                {col.label}
              </span>
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-full border"
                style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink3)' }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Column body */}
            <div
              className="rounded-b border p-2 flex flex-col gap-1.5 min-h-28"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              {colTasks.length === 0 ? (
                <p className="font-mono text-[10px] italic text-center pt-4" style={{ color: 'var(--ink3)' }}>
                  No tasks
                </p>
              ) : (
                colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onStatusChange={status => onStatusChange(task.id, status)}
                    onToggleDone={() => onToggleDone(task.id)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
