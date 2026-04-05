'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatsBar } from '@/components/layout/StatsBar'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ProjectModal } from '@/components/tasks/ProjectModal'
import { BrainDumpReview } from '@/components/brain-dump/BrainDumpReview'
import { useToast } from '@/components/ui/Toast'
import type { TaskWithProject, ProjectWithStats } from '@/lib/types'

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'
type Filter = 'all' | 'p1' | 'p2' | 'p3' | 'overdue' | 'internal' | 'external' | 'odoo' | 'claude' | 'blocked' | 'week'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast  = useToast()

  const [tasks,    setTasks]    = useState<TaskWithProject[]>([])
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [sync,     setSync]     = useState<SyncStatus>('idle')
  const [filter,   setFilter]   = useState<Filter>('all')
  const [search,   setSearch]   = useState('')

  const [taskModal,    setTaskModal]    = useState(false)
  const [projModal,    setProjModal]    = useState(false)
  const [editTask,     setEditTask]     = useState<TaskWithProject | null>(null)
  const [editProj,     setEditProj]     = useState<ProjectWithStats | null>(null)
  const [dumpReview,   setDumpReview]   = useState<any>(null)
  const [analyzing,    setAnalyzing]    = useState(false)

  // ── Redirect if not authed ──────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // ── Load data ───────────────────────────────────────────────
  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [tRes, pRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/projects'),
    ])
    if (tRes.ok) setTasks(await tRes.json())
    if (pRes.ok) setProjects(await pRes.json())
  }

  // ── Sync helper ─────────────────────────────────────────────
  function withSync<T>(fn: () => Promise<T>): Promise<T> {
    setSync('saving')
    return fn()
      .then(r => { setSync('saved'); setTimeout(() => setSync('idle'), 2500); return r })
      .catch(e => { setSync('error'); throw e })
  }

  // ── Task CRUD ────────────────────────────────────────────────
  async function saveTask(data: Partial<TaskWithProject> & { projectId: string }) {
    await withSync(async () => {
      if (editTask) {
        const res = await fetch(`/api/tasks/${editTask.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        })
        if (!res.ok) { toast('Failed to save task', 'error'); return }
        const updated = await res.json()
        setTasks(ts => ts.map(t => t.id === editTask.id ? updated : t))
        toast('Task updated')
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        })
        if (!res.ok) { toast('Failed to create task', 'error'); return }
        const created = await res.json()
        setTasks(ts => [created, ...ts])
        toast('Task created')
      }
    })
  }

  async function deleteTask() {
    if (!editTask) return
    await withSync(async () => {
      await fetch(`/api/tasks/${editTask.id}`, { method: 'DELETE' })
      setTasks(ts => ts.filter(t => t.id !== editTask.id))
      toast('Task deleted')
    })
    setEditTask(null)
    setTaskModal(false)
  }

  async function patchTaskStatus(taskId: string, status: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const updated = { ...task, status }
    setTasks(ts => ts.map(t => t.id === taskId ? updated as TaskWithProject : t))
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function toggleDone(taskId: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await patchTaskStatus(taskId, newStatus)
  }

  async function quickAdd(title: string, priority: string, projectId: string) {
    await saveTask({ title, priority, projectId, status: 'todo', type: 'internal', source: 'manual' } as any)
  }

  // ── Project CRUD ─────────────────────────────────────────────
  async function saveProject(data: any) {
    await withSync(async () => {
      if (editProj) {
        const res = await fetch(`/api/projects/${editProj.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        })
        if (!res.ok) { toast('Failed to save project', 'error'); return }
        const updated = await res.json()
        setProjects(ps => ps.map(p => p.id === editProj.id ? updated : p))
        toast('Project updated')
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        })
        if (!res.ok) { toast('Failed to create project', 'error'); return }
        const created = await res.json()
        setProjects(ps => [created, ...ps])
        toast('Project created')
      }
    })
  }

  async function deleteProject() {
    if (!editProj) return
    await withSync(async () => {
      await fetch(`/api/projects/${editProj.id}`, { method: 'DELETE' })
      setProjects(ps => ps.filter(p => p.id !== editProj.id))
      toast('Project deleted')
    })
    setEditProj(null)
    setProjModal(false)
  }

  // ── Brain dump ───────────────────────────────────────────────
  async function saveBrainDump(text: string) {
    await fetch('/api/brain-dump', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
  }

  async function analyzeDump(text: string) {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/brain-dump/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, projectNames: projects.map(p => p.name) }),
      })
      if (!res.ok) { toast('Claude analysis failed', 'error'); return }
      const analysis = await res.json()
      setDumpReview(analysis)
    } catch {
      toast('Claude analysis failed', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  async function approveDumpSuggestions(approved: any[]) {
    for (const s of approved) {
      if (s.type === 'task') {
        const proj = projects.find(p => p.name === s.projectHint) ?? projects[0]
        await saveTask({
          title: s.title, notes: s.description, priority: s.priority,
          projectId: proj?.id, status: 'todo', type: 'internal',
          urgency: s.urgency, impact: s.impact, source: 'brain_dump',
        } as any)
      } else if (s.type === 'improvement') {
        await fetch('/api/improvements', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: s.title, description: s.description,
            category: s.category ?? 'process', priority: s.priority,
          }),
        })
      }
    }
    setDumpReview(null)
    toast(`${approved.length} items added`)
  }

  // ── Filter tasks ─────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let ts = tasks.filter(t => t.status !== 'done' || filter === 'all')

    // Status-based quick views
    if (filter === 'all')      ts = tasks
    if (filter === 'p1')       ts = tasks.filter(t => t.priority === 'p1' && t.status !== 'done')
    if (filter === 'p2')       ts = tasks.filter(t => t.priority === 'p2' && t.status !== 'done')
    if (filter === 'p3')       ts = tasks.filter(t => t.priority === 'p3' && t.status !== 'done')
    if (filter === 'blocked')  ts = tasks.filter(t => t.status === 'blocked')
    if (filter === 'claude')   ts = tasks.filter(t => t.claudeQueue && t.status !== 'done')
    if (filter === 'internal') ts = tasks.filter(t => t.type === 'internal' && t.status !== 'done')
    if (filter === 'external') ts = tasks.filter(t => t.type === 'external' && t.status !== 'done')
    if (filter === 'odoo')     ts = tasks.filter(t => t.type === 'odoo' && t.status !== 'done')
    if (filter === 'overdue') {
      const now = new Date()
      ts = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
    }
    if (filter === 'week') {
      const week = new Date(); week.setDate(week.getDate() + 7)
      ts = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= week && t.status !== 'done')
    }

    if (search) {
      const q = search.toLowerCase()
      ts = ts.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.project.name.toLowerCase().includes(q)
      )
    }

    return ts
  }, [tasks, filter, search])

  // ── Stats ─────────────────────────────────────────────────────
  const openTasks  = tasks.filter(t => t.status !== 'done')
  const now        = new Date()
  const overdueCt  = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now).length
  const claudeQueueItems = tasks.filter(t => t.claudeQueue && t.status !== 'done')

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="font-display text-2xl tracking-widest" style={{ color: 'var(--gold)' }}>
        LOADING…
      </div>
    </div>
  )

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'ALL' }, { id: 'p1', label: 'P1 TODAY' },
    { id: 'p2', label: 'P2 WEEK' }, { id: 'p3', label: 'P3 BACKLOG' },
    { id: 'overdue', label: '⚠ OVERDUE' }, { id: 'internal', label: 'INTERNAL' },
    { id: 'external', label: 'EXTERNAL' }, { id: 'odoo', label: 'ODOO' },
    { id: 'claude', label: '→ CLAUDE' }, { id: 'blocked', label: 'BLOCKED' },
    { id: 'week', label: 'THIS WEEK' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar
        onNewTask={() => { setEditTask(null); setTaskModal(true) }}
        onNewProject={() => { setEditProj(null); setProjModal(true) }}
        syncStatus={sync}
      />

      <StatsBar
        total={openTasks.length}
        p1={openTasks.filter(t => t.priority === 'p1').length}
        inProgress={openTasks.filter(t => t.status === 'inprogress').length}
        blocked={openTasks.filter(t => t.status === 'blocked').length}
        overdue={overdueCt}
        claudeQueue={claudeQueueItems.length}
      />

      {/* Filter bar */}
      <div
        className="flex items-center gap-1.5 px-4 py-2 flex-wrap flex-shrink-0 sticky z-40"
        style={{ top: 56 + 64, background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}
      >
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`fchip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <input
          className="field-input ml-auto text-[10px] font-mono"
          style={{ width: 160, padding: '3px 10px' }}
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0" style={{ overflow: 'visible' }}>
        <Sidebar
          quickAddProjects={projects.map(p => ({ id: p.id, name: p.name }))}
          claudeQueue={claudeQueueItems.map(t => ({ id: t.id, title: t.title, project: t.project }))}
          onQuickAdd={quickAdd}
          onBrainDump={saveBrainDump}
          onAnalyzeDump={analyzeDump}
          analyzing={analyzing}
        />
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={task => { setEditTask(task); setTaskModal(true) }}
          onStatusChange={patchTaskStatus}
          onToggleDone={toggleDone}
        />
      </div>

      {/* Modals */}
      <TaskModal
        open={taskModal}
        onClose={() => { setTaskModal(false); setEditTask(null) }}
        task={editTask}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        onSave={saveTask}
        onDelete={editTask ? deleteTask : undefined}
      />

      <ProjectModal
        open={projModal}
        onClose={() => { setProjModal(false); setEditProj(null) }}
        project={editProj as any}
        onSave={saveProject}
        onDelete={editProj ? deleteProject : undefined}
      />

      {dumpReview && (
        <BrainDumpReview
          analysis={dumpReview}
          onApprove={approveDumpSuggestions}
          onClose={() => setDumpReview(null)}
        />
      )}
    </div>
  )
}
