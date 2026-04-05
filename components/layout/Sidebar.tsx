'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

interface ClaudeQueueItem {
  id: string
  title: string
  project: { name: string }
}

interface SidebarProps {
  quickAddProjects: { id: string; name: string }[]
  claudeQueue: ClaudeQueueItem[]
  onQuickAdd: (title: string, priority: string, projectId: string) => Promise<void>
  onBrainDump: (text: string) => Promise<void>
  onAnalyzeDump: (text: string) => Promise<void>
  analyzing?: boolean
}

export function Sidebar({
  quickAddProjects,
  claudeQueue,
  onQuickAdd,
  onBrainDump,
  onAnalyzeDump,
  analyzing = false,
}: SidebarProps) {
  const toast = useToast()
  const [qaTitle, setQaTitle]   = useState('')
  const [qaPri,   setQaPri]     = useState('p2')
  const [qaProj,  setQaProj]    = useState('')
  const [dump,    setDump]      = useState('')

  async function handleQuickAdd() {
    if (!qaTitle.trim()) return
    const projId = qaProj || quickAddProjects[0]?.id
    if (!projId) { toast('No projects found — create one first', 'error'); return }
    await onQuickAdd(qaTitle.trim(), qaPri, projId)
    setQaTitle('')
    toast('Task added')
  }

  async function handleDumpSave() {
    if (!dump.trim()) return
    await onBrainDump(dump)
    toast('Brain dump saved')
  }

  async function handleDumpAnalyze() {
    if (!dump.trim()) { toast('Type something first', 'error'); return }
    await onAnalyzeDump(dump)
  }

  return (
    <aside
      className="flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ width: 272, background: 'var(--plate)', borderRight: '1px solid var(--line)' }}
    >
      {/* ── Quick Add ──────────────────────────────────── */}
      <SidebarSection label="⚡ Quick Add">
        <input
          className="field-input text-sm mb-2"
          placeholder="Task title… (Enter)"
          value={qaTitle}
          onChange={e => setQaTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
        />
        <div className="flex gap-1.5 mb-1.5">
          <select className="field-select flex-1" value={qaPri} onChange={e => setQaPri(e.target.value)}>
            <option value="p1">P1 Critical</option>
            <option value="p2">P2 Week</option>
            <option value="p3">P3 Backlog</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          <select className="field-select flex-1" value={qaProj} onChange={e => setQaProj(e.target.value)}>
            {quickAddProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn-gold px-3 text-xs" onClick={handleQuickAdd}>ADD →</button>
        </div>
      </SidebarSection>

      {/* ── Brain Dump ─────────────────────────────────── */}
      <SidebarSection label="🧠 Brain Dump">
        <textarea
          className="field-textarea w-full mb-2"
          style={{ minHeight: 110 }}
          placeholder={"Dump thoughts here…\n\ne.g.\nFollow up with Dane County\nAllen flagged cutting edge shortage\nIdea: automate build report"}
          value={dump}
          onChange={e => setDump(e.target.value)}
        />
        <div className="flex gap-1.5">
          <button
            className="btn flex-1 justify-center text-[10px]"
            onClick={handleDumpSave}
          >
            SAVE
          </button>
          <button
            className="btn flex-[2] justify-center text-[10px]"
            style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}
            onClick={handleDumpAnalyze}
            disabled={analyzing}
          >
            {analyzing ? '⏳ ANALYZING…' : '🤖 ANALYZE'}
          </button>
        </div>
        <p className="font-mono text-[9px] mt-1.5" style={{ color: 'var(--ink3)' }}>
          Analyze → Claude reviews and suggests tasks for your approval
        </p>
      </SidebarSection>

      {/* ── Claude's Queue ──────────────────────────────── */}
      <SidebarSection label="🤖 Claude's Queue" flex>
        {claudeQueue.length === 0 ? (
          <p className="font-mono text-[10px] italic" style={{ color: 'var(--ink3)' }}>
            No tasks queued for Claude
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {claudeQueue.map(item => (
              <div
                key={item.id}
                className="rounded px-2.5 py-2"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--line2)',
                  borderLeft: '3px solid var(--purple)',
                }}
              >
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ink)' }}>{item.title}</p>
                <p className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>{item.project.name}</p>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>
    </aside>
  )
}

function SidebarSection({
  label,
  children,
  flex = false,
}: {
  label: string
  children: React.ReactNode
  flex?: boolean
}) {
  return (
    <div className={flex ? 'flex flex-col flex-1' : ''}>
      <div
        className="font-mono text-[10px] uppercase tracking-widest px-3.5 py-2"
        style={{ color: 'var(--ink3)', borderBottom: '1px solid var(--line)' }}
      >
        {label}
      </div>
      <div className={`p-3 ${flex ? 'flex-1' : ''}`} style={{ borderBottom: '1px solid var(--line)' }}>
        {children}
      </div>
    </div>
  )
}
