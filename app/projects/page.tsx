'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ProjectModal } from '@/components/tasks/ProjectModal'
import { useToast } from '@/components/ui/Toast'
import { Badge, StatusDot } from '@/components/ui/Badge'
import type { ProjectWithStats, TaskWithProject } from '@/lib/types'

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast  = useToast()

  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [tasks,    setTasks]    = useState<TaskWithProject[]>([])
  const [taskModal,        setTaskModal]        = useState(false)
  const [projModal,        setProjModal]        = useState(false)
  const [editTask,         setEditTask]         = useState<TaskWithProject | null>(null)
  const [editProj,         setEditProj]         = useState<ProjectWithStats | null>(null)
  const [activeProj,       setActiveProj]       = useState<string | null>(null)
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>(undefined)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => { load() }, [])

  async function load() {
    const [pRes, tRes] = await Promise.all([fetch('/api/projects'), fetch('/api/tasks')])
    if (pRes.ok) setProjects(await pRes.json())
    if (tRes.ok) setTasks(await tRes.json())
  }

  async function saveTask(data: any) {
    if (editTask) {
      const res = await fetch(`/api/tasks/${editTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { const u = await res.json(); setTasks(ts => ts.map(t => t.id === editTask.id ? u : t)); toast('Task updated') }
    } else {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { const c = await res.json(); setTasks(ts => [c, ...ts]); toast('Task created') }
    }
  }

  async function deleteTask() {
    if (!editTask) return
    await fetch(`/api/tasks/${editTask.id}`, { method: 'DELETE' })
    setTasks(ts => ts.filter(t => t.id !== editTask.id))
    setEditTask(null); setTaskModal(false); toast('Task deleted')
  }

  async function saveProject(data: any) {
    if (editProj) {
      const res = await fetch(`/api/projects/${editProj.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { const u = await res.json(); setProjects(ps => ps.map(p => p.id === editProj.id ? u : p)); toast('Project updated') }
    } else {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { const c = await res.json(); setProjects(ps => [c, ...ps]); toast('Project created') }
    }
  }

  async function deleteProject() {
    if (!editProj) return
    const res = await fetch(`/api/projects/${editProj.id}`, { method: 'DELETE' })
    if (!res.ok) { const e = await res.json(); toast(e.error, 'error'); return }
    setProjects(ps => ps.filter(p => p.id !== editProj.id)); setEditProj(null); setProjModal(false); toast('Project deleted')
  }

  const statColors: Record<string, string> = {
    active: 'var(--p3)', inprogress: 'var(--blue)', todo: 'var(--ink3)', done: 'var(--ink3)', archived: 'var(--ink3)'
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar
        onNewTask={() => { setEditTask(null); setTaskModal(true) }}
        onNewProject={() => { setEditProj(null); setProjModal(true) }}
      />

      <div className="flex-1 p-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {projects.map(p => {
            const pTasks = tasks.filter(t => t.projectId === p.id && t.status !== 'done')
            const done   = (p.taskStats?.done ?? 0)
            const total  = (p.taskStats?.total ?? 0)
            const pct    = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <div
                key={p.id}
                className="rounded cursor-pointer transition-all relative overflow-hidden"
                style={{
                  background: 'var(--panel)', border: '1px solid var(--line)',
                  transition: 'all .12s',
                }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                onClick={() => setActiveProj(activeProj === p.id ? null : p.id)}
              >
                {/* Color bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: p.color }} />

                <div className="p-4 pt-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusDot status={p.status} />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{p.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={p.priority}>{p.priority.toUpperCase()}</Badge>
                      <Badge variant={p.type}>{p.type}</Badge>
                      <span
                        className="font-mono text-[10px] transition-transform duration-150"
                        style={{ color: 'var(--ink3)', transform: activeProj === p.id ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
                      >
                        ▾
                      </span>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink2)' }}>{p.description}</p>
                  )}

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="h-1 rounded-full" style={{ background: 'var(--line2)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
                      <span style={{ color: 'var(--ink2)' }}>{done}</span>/{total} done
                    </span>
                    {(p.taskStats?.p1 ?? 0) > 0 && (
                      <span className="font-mono text-[10px]" style={{ color: 'var(--p1)' }}>
                        {p.taskStats?.p1} P1
                      </span>
                    )}
                    {(p.taskStats?.overdue ?? 0) > 0 && (
                      <span className="font-mono text-[10px]" style={{ color: 'var(--p1)' }}>
                        ⚠ {p.taskStats?.overdue} overdue
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      className="btn text-[10px] flex-1 justify-center"
                      onClick={e => { e.stopPropagation(); setEditTask(null); setNewTaskProjectId(p.id); setTaskModal(true) }}
                    >
                      + Task
                    </button>
                    <button
                      className="btn text-[10px]"
                      onClick={e => { e.stopPropagation(); setEditProj(p); setProjModal(true) }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Expanded task list */}
                  {activeProj === p.id && pTasks.length > 0 && (
                    <div className="mt-3 border-t pt-3 flex flex-col gap-1.5" style={{ borderColor: 'var(--line)' }}>
                      {pTasks.map(t => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer"
                          style={{ background: 'var(--raised)' }}
                          onClick={e => { e.stopPropagation(); setEditTask(t); setTaskModal(true) }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === 'p1' ? 'bg-p1' : t.priority === 'p2' ? 'bg-p2' : 'bg-p3'}`}
                            style={{ background: t.priority === 'p1' ? 'var(--p1)' : t.priority === 'p2' ? 'var(--p2)' : 'var(--p3)' }} />
                          <span className="text-xs flex-1 truncate" style={{ color: 'var(--ink2)' }}>{t.title}</span>
                          <span className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TaskModal
        open={taskModal}
        onClose={() => { setTaskModal(false); setEditTask(null); setNewTaskProjectId(undefined) }}
        task={editTask}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        onSave={saveTask}
        onDelete={editTask ? deleteTask : undefined}
        defaultProjectId={newTaskProjectId}
      />
      <ProjectModal
        open={projModal}
        onClose={() => { setProjModal(false); setEditProj(null) }}
        project={editProj as any}
        onSave={saveProject}
        onDelete={editProj ? deleteProject : undefined}
      />
    </div>
  )
}
