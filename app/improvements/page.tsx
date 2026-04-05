'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ModalFooter, FormField } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Improvement {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  status: string
  impact: string | null
  estimatedValue: string | null
  submittedBy: string | null
  urgency: number | null
  impactScore: number | null
  createdAt: string
  updatedAt: string
}

const CATEGORIES = ['product', 'process', 'workflow', 'technology']
const STATUSES   = ['proposed', 'reviewing', 'approved', 'implementing', 'done', 'rejected']

const statusColor: Record<string, string> = {
  proposed:      'var(--ink3)',
  reviewing:     'var(--blue)',
  approved:      'var(--gold)',
  implementing:  'var(--p2)',
  done:          'var(--p3)',
  rejected:      'var(--p1)',
}

export default function ImprovementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast  = useToast()

  const [items,    setItems]    = useState<Improvement[]>([])
  const [filter,   setFilter]   = useState<string>('all')
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState<Improvement | null>(null)
  const [form,     setForm]     = useState({ title: '', description: '', category: 'process', priority: 'p2', impact: '', estimatedValue: '', urgency: '', impactScore: '' })
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/improvements')
    if (res.ok) setItems(await res.json())
  }

  function openNew() { setEditing(null); setForm({ title: '', description: '', category: 'process', priority: 'p2', impact: '', estimatedValue: '', urgency: '', impactScore: '' }); setModal(true) }
  function openEdit(item: Improvement) {
    setEditing(item)
    setForm({ title: item.title, description: item.description ?? '', category: item.category, priority: item.priority, impact: item.impact ?? '', estimatedValue: item.estimatedValue ?? '', urgency: item.urgency?.toString() ?? '', impactScore: item.impactScore?.toString() ?? '' })
    setModal(true)
  }

  async function save() {
    setSaving(true)
    const data = { ...form, urgency: form.urgency ? parseInt(form.urgency) : null, impactScore: form.impactScore ? parseInt(form.impactScore) : null }
    if (editing) {
      const res = await fetch(`/api/improvements/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { const u = await res.json(); setItems(is => is.map(i => i.id === editing.id ? u : i)); toast('Updated') }
    } else {
      const res = await fetch('/api/improvements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { const c = await res.json(); setItems(is => [c, ...is]); toast('Improvement added') }
    }
    setSaving(false); setModal(false)
  }

  async function patchStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/improvements/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    if (res.ok) { const u = await res.json(); setItems(is => is.map(i => i.id === id ? u : i)) }
  }

  async function del() {
    if (!editing) return
    await fetch(`/api/improvements/${editing.id}`, { method: 'DELETE' })
    setItems(is => is.filter(i => i.id !== editing.id)); setModal(false); toast('Deleted')
  }

  const filtered = filter === 'all' ? items : filter === 'done' ? items.filter(i => i.status === 'done') : items.filter(i => i.category === filter || i.status === filter)

  const catColors: Record<string, string> = { product: 'var(--blue)', process: 'var(--gold)', workflow: 'var(--p3)', technology: 'var(--purple)' }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar onNewTask={() => {}} onNewProject={() => {}} />

      <div className="flex-1 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl tracking-wide" style={{ color: 'var(--gold)' }}>IMPROVEMENTS QUEUE</h1>
            <p className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
              Product · Process · Workflow · Technology improvements
            </p>
          </div>
          <button className="btn-gold" onClick={openNew}>+ Add Improvement</button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['all', ...CATEGORIES, 'proposed', 'approved', 'done'].map(f => (
            <button key={f} className={`fchip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORIES.map(cat => {
            const catItems = items.filter(i => i.category === cat && i.status !== 'done' && i.status !== 'rejected')
            return (
              <div key={cat} className="rounded p-3" style={{ background: 'var(--plate)', border: '1px solid var(--line)', borderTop: `2px solid ${catColors[cat]}` }}>
                <div className="font-display text-2xl" style={{ color: catColors[cat] }}>{catItems.length}</div>
                <div className="font-mono text-[10px] uppercase" style={{ color: 'var(--ink3)' }}>{cat}</div>
              </div>
            )
          })}
        </div>

        {/* Items */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="font-mono text-xs italic" style={{ color: 'var(--ink3)' }}>No improvements in this filter</p>
          )}
          {filtered.map(item => (
            <div key={item.id} className="rounded p-4 cursor-pointer transition-all"
              style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderLeft: `3px solid ${catColors[item.category] ?? 'var(--gold)'}` }}
              onClick={() => openEdit(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm"
                      style={{ color: catColors[item.category], background: `${catColors[item.category]}18`, border: `1px solid ${catColors[item.category]}40` }}>
                      {item.category}
                    </span>
                    <Badge variant={item.priority}>{item.priority.toUpperCase()}</Badge>
                    <span className="font-mono text-[9px] font-bold uppercase"
                      style={{ color: statusColor[item.status] }}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>{item.title}</h3>
                  {item.description && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>{item.description}</p>
                  )}
                  {(item.impact || item.estimatedValue) && (
                    <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--ink3)' }}>
                      {item.impact && `Impact: ${item.impact}`}
                      {item.impact && item.estimatedValue && ' · '}
                      {item.estimatedValue && `Value: ${item.estimatedValue}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                  {STATUSES.filter(s => s !== item.status).slice(0, 3).map(s => (
                    <button key={s} className="font-mono text-[9px] px-2 py-0.5 rounded-sm border uppercase"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink3)' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = statusColor[s]; e.currentTarget.style.color = statusColor[s] }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink3)' }}
                      onClick={() => patchStatus(item.id, s)}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'EDIT IMPROVEMENT' : '+ NEW IMPROVEMENT'}>
        <FormField label="Title *">
          <input className="field-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What should be improved?" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category">
            <select className="field-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="field-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="p1">P1 Critical</option>
              <option value="p2">P2 Standard</option>
              <option value="p3">P3 Backlog</option>
            </select>
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className="field-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What problem does this solve?" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Impact description">
            <input className="field-input" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} placeholder="e.g. Reduces errors by 30%" />
          </FormField>
          <FormField label="Estimated value">
            <input className="field-input" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} placeholder="e.g. 2hrs/week saved" />
          </FormField>
        </div>
        <ModalFooter>
          {editing && <button className="btn-danger mr-auto" onClick={del}>Delete</button>}
          <button className="btn" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-gold" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
