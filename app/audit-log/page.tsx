'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'

interface LogEntry {
  id: string
  actor: string
  action: string
  tableName: string
  recordId: string
  before: any
  after: any
  notes: string | null
  createdAt: string
}

const actionColor: Record<string, string> = {
  create:   'var(--p3)',
  update:   'var(--gold)',
  delete:   'var(--p1)',
  analyze:  'var(--purple)',
  approve:  'var(--p3)',
  reject:   'var(--p1)',
}

const actorColor = (actor: string) =>
  actor === 'claude'   ? 'var(--purple)' :
  actor === 'system'   ? 'var(--ink3)' :
  actor.startsWith('webhook') ? 'var(--blue)' :
  'var(--ink2)'

export default function AuditLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs,   setLogs]   = useState<LogEntry[]>([])
  const [total,  setTotal]  = useState(0)
  const [page,   setPage]   = useState(1)
  const [actor,  setActor]  = useState('')
  const [table,  setTable]  = useState('')
  const [action, setAction] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => { load() }, [page, actor, table, action])

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (actor)  params.set('actor',  actor)
    if (table)  params.set('table',  table)
    if (action) params.set('action', action)
    const res = await fetch(`/api/audit-log?${params}`)
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total) }
  }

  function reset() { setActor(''); setTable(''); setAction(''); setPage(1) }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar onNewTask={() => {}} onNewProject={() => {}} />

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl tracking-wide" style={{ color: 'var(--gold)' }}>AUDIT LOG</h1>
            <p className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
              Every create, update, delete, and AI action — with full before/after state
            </p>
          </div>
          <span className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>{total} entries</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select className="field-select" style={{ width: 140 }} value={actor} onChange={e => { setActor(e.target.value); setPage(1) }}>
            <option value="">All Actors</option>
            <option value="claude">claude</option>
            {session?.user?.email && <option value={session.user.email}>{session.user.email}</option>}
          </select>
          <select className="field-select" style={{ width: 140 }} value={table} onChange={e => { setTable(e.target.value); setPage(1) }}>
            <option value="">All Tables</option>
            <option value="tasks">tasks</option>
            <option value="projects">projects</option>
            <option value="improvements">improvements</option>
            <option value="brain_dump">brain_dump</option>
          </select>
          <select className="field-select" style={{ width: 140 }} value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
            <option value="">All Actions</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
            <option value="analyze">analyze</option>
          </select>
          {(actor || table || action) && (
            <button className="btn" onClick={reset}>Clear</button>
          )}
        </div>

        {/* Log entries */}
        <div className="flex flex-col gap-1">
          {logs.map(log => (
            <div key={log.id}>
              <div
                className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer"
                style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <span className="font-mono text-[9px]" style={{ color: 'var(--ink3)', minWidth: 120 }}>
                  {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm"
                  style={{ color: actionColor[log.action] ?? 'var(--ink2)', background: `${actionColor[log.action]}18`, border: `1px solid ${actionColor[log.action]}30`, minWidth: 64, textAlign: 'center' }}>
                  {log.action}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--ink3)', minWidth: 90 }}>{log.tableName}</span>
                <span className="font-mono text-[10px] font-medium flex-1" style={{ color: actorColor(log.actor) }}>{log.actor}</span>
                {log.notes && <span className="font-mono text-[9px] truncate max-w-xs" style={{ color: 'var(--ink3)' }}>{log.notes}</span>}
                <span className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>{expanded === log.id ? '▲' : '▼'}</span>
              </div>

              {expanded === log.id && (
                <div className="rounded-b px-3 py-3 mb-1" style={{ background: 'var(--raised)', border: '1px solid var(--line)', borderTop: 'none' }}>
                  <p className="font-mono text-[9px] mb-1.5" style={{ color: 'var(--ink3)' }}>
                    Record ID: <span style={{ color: 'var(--ink2)' }}>{log.recordId}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {log.before && (
                      <div>
                        <p className="font-mono text-[9px] uppercase mb-1" style={{ color: 'var(--p1)' }}>Before</p>
                        <pre className="font-mono text-[9px] leading-relaxed overflow-x-auto p-2 rounded" style={{ background: 'var(--bg)', color: 'var(--ink2)', maxHeight: 160 }}>
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div>
                        <p className="font-mono text-[9px] uppercase mb-1" style={{ color: 'var(--p3)' }}>After</p>
                        <pre className="font-mono text-[9px] leading-relaxed overflow-x-auto p-2 rounded" style={{ background: 'var(--bg)', color: 'var(--ink2)', maxHeight: 160 }}>
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex justify-center gap-2 mt-4">
            <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span className="font-mono text-[10px] self-center" style={{ color: 'var(--ink3)' }}>
              Page {page} of {Math.ceil(total / 50)}
            </span>
            <button className="btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
