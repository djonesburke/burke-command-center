'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { BrainDumpReview } from '@/components/brain-dump/BrainDumpReview'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ProjectModal } from '@/components/tasks/ProjectModal'
import { useToast } from '@/components/ui/Toast'

interface DumpRecord {
  id: string
  content: string
  processed: boolean
  approved: boolean
  createdAt: string
  analysis?: string
}

export default function BrainDumpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast  = useToast()

  const [dumps,     setDumps]     = useState<DumpRecord[]>([])
  const [projects,  setProjects]  = useState<{ id: string; name: string }[]>([])
  const [text,      setText]      = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [review,    setReview]    = useState<any>(null)
  const [taskModal,  setTaskModal]  = useState(false)
  const [projModal,  setProjModal]  = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => { load() }, [])

  async function load() {
    const [dRes, pRes] = await Promise.all([fetch('/api/brain-dump'), fetch('/api/projects')])
    if (dRes.ok) setDumps(await dRes.json())
    if (pRes.ok) setProjects((await pRes.json()).map((p: any) => ({ id: p.id, name: p.name })))
  }

  async function handleSave() {
    if (!text.trim()) return
    const res = await fetch('/api/brain-dump', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    if (res.ok) {
      const d = await res.json()
      setDumps(ds => [d, ...ds])
      setText('')
      toast('Brain dump saved')
    }
  }

  async function handleAnalyze() {
    if (!text.trim()) { toast('Type something first', 'error'); return }
    setAnalyzing(true)
    const res = await fetch('/api/brain-dump/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, projectNames: projects.map(p => p.name) }),
    })
    setAnalyzing(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast(err.error ?? 'Analysis failed — check server logs', 'error')
      return
    }
    const analysis = await res.json()
    setReview(analysis)
    load() // refresh dump list
  }

  async function approveItems(approved: any[]) {
    for (const s of approved) {
      if (s.type === 'task') {
        const proj = projects.find(p => p.name === s.projectHint) ?? projects[0]
        await fetch('/api/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: s.title, notes: s.description, priority: s.priority,
            projectId: proj?.id, status: 'todo', type: 'internal',
            urgency: s.urgency, impact: s.impact, source: 'brain_dump',
          }),
        })
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
    setReview(null)
    setText('')
    toast(`${approved.length} items created`)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar
        onNewTask={() => setTaskModal(true)}
        onNewProject={() => setProjModal(true)}
      />

      <div className="flex-1 flex gap-4 p-4" style={{ minHeight: 0 }}>
        {/* Input panel */}
        <div className="flex flex-col" style={{ width: 480 }}>
          <div className="rounded p-5" style={{ background: 'var(--plate)', border: '1px solid var(--line)', borderTop: '2px solid var(--gold)' }}>
            <h2 className="font-display text-xl tracking-wide mb-1" style={{ color: 'var(--gold)' }}>
              🧠 BRAIN DUMP
            </h2>
            <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--ink3)' }}>
              Dump everything on your mind. Claude will analyze and suggest tasks & improvements for your approval.
            </p>
            <textarea
              className="field-textarea w-full mb-3"
              style={{ minHeight: 240 }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"Examples:\n• Follow up with Dane County on plow contract\n• Allen flagged cutting edge shortage coming\n• Idea: automate build sheet from SO\n• Need to review Q2 hiring plan\n• SolidWorks CAM issue on model 7xx — investigate"}
            />
            <div className="flex gap-2">
              <button className="btn flex-1 justify-center py-2" onClick={handleSave} disabled={!text.trim()}>
                SAVE ONLY
              </button>
              <button
                className="btn flex-[2] justify-center py-2"
                style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}
                onClick={handleAnalyze}
                disabled={analyzing || !text.trim()}
              >
                {analyzing ? '⏳ ANALYZING…' : '🤖 ANALYZE WITH CLAUDE'}
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--ink3)' }}>
            Recent Dumps
          </h3>
          {dumps.length === 0 ? (
            <p className="font-mono text-xs italic" style={{ color: 'var(--ink3)' }}>No brain dumps yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dumps.map(d => (
                <div key={d.id} className="rounded p-3" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>
                      {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {d.processed && (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(167,139,250,.15)', color: 'var(--purple)', border: '1px solid rgba(167,139,250,.3)' }}>
                        ANALYZED
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--ink2)' }}>
                    {d.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {review && (
        <BrainDumpReview analysis={review} onApprove={approveItems} onClose={() => setReview(null)} />
      )}
      <TaskModal open={taskModal} onClose={() => setTaskModal(false)} projects={projects} onSave={async () => {}} />
      <ProjectModal open={projModal} onClose={() => setProjModal(false)} onSave={async () => {}} />
    </div>
  )
}
