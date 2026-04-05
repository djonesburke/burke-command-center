'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalFooter, FormField } from '@/components/ui/Modal'
import type { TaskWithProject } from '@/lib/types'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  task?: TaskWithProject | null
  projects: { id: string; name: string }[]
  onSave: (data: Partial<TaskWithProject> & { projectId: string }) => Promise<void>
  onDelete?: () => Promise<void>
}

const emptyForm = {
  title: '', priority: 'p2', type: 'internal', status: 'todo',
  owner: 'Dalton', projectId: '', dueDate: '', hours: '',
  nextAction: '', notes: '', claudeQueue: false, recurring: false,
  urgency: '', impact: '',
}

export function TaskModal({ open, onClose, task, projects, onSave, onDelete }: TaskModalProps) {
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title:      task.title,
        priority:   task.priority,
        type:       task.type,
        status:     task.status,
        owner:      task.owner ?? 'Dalton',
        projectId:  task.projectId,
        dueDate:    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        hours:      task.hours?.toString() ?? '',
        nextAction: task.nextAction ?? '',
        notes:      task.notes ?? '',
        claudeQueue: task.claudeQueue,
        recurring:  task.recurring,
        urgency:    task.urgency?.toString() ?? '',
        impact:     task.impact?.toString() ?? '',
      })
    } else {
      setForm({ ...emptyForm, projectId: projects[0]?.id ?? '' })
    }
    setNewNote('')
  }, [task, open, projects])

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      dueDate:   form.dueDate ? new Date(form.dueDate) : null,
      hours:     form.hours   ? parseFloat(form.hours) : null,
      urgency:   form.urgency ? parseInt(form.urgency) : null,
      impact:    form.impact  ? parseInt(form.impact)  : null,
    } as any)
    setSaving(false)
    onClose()
  }

  const isEdit = !!task

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `EDIT TASK` : `+ NEW TASK`}>
      <FormField label="Title *">
        <input className="field-input" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="What needs to be done?" />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Priority">
          <select className="field-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="p1">🔴 P1 — Critical / Today</option>
            <option value="p2">🟡 P2 — This Week</option>
            <option value="p3">🟢 P3 — Backlog</option>
          </select>
        </FormField>
        <FormField label="Type">
          <select className="field-select" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="odoo">Odoo</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Project">
          <select className="field-select" value={form.projectId} onChange={e => set('projectId', e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Due Date">
          <input className="field-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status">
          <select className="field-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="waiting">Waiting</option>
            <option value="done">Done</option>
          </select>
        </FormField>
        <FormField label="Est. Hours">
          <input className="field-input" type="number" min="0" step="0.5" value={form.hours}
            onChange={e => set('hours', e.target.value)} placeholder="e.g. 2" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Urgency (1–5)">
          <select className="field-select" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
            <option value="">—</option>
            <option value="5">5 — Today</option>
            <option value="4">4 — Tomorrow</option>
            <option value="3">3 — This Week</option>
            <option value="2">2 — This Month</option>
            <option value="1">1 — Someday</option>
          </select>
        </FormField>
        <FormField label="Impact (1–5)">
          <select className="field-select" value={form.impact} onChange={e => set('impact', e.target.value)}>
            <option value="">—</option>
            <option value="5">5 — Game-Changing</option>
            <option value="4">4 — High Impact</option>
            <option value="3">3 — Meaningful</option>
            <option value="2">2 — Minor</option>
            <option value="1">1 — Negligible</option>
          </select>
        </FormField>
      </div>

      <FormField label="Owner">
        <input className="field-input" value={form.owner} onChange={e => set('owner', e.target.value)} />
      </FormField>

      <FormField label="Next Action">
        <input className="field-input" value={form.nextAction}
          onChange={e => set('nextAction', e.target.value)} placeholder="Specific next step…" />
      </FormField>

      <FormField label="Notes / Blocker">
        <textarea className="field-textarea" value={form.notes}
          onChange={e => set('notes', e.target.value)} placeholder="Context, blockers, links…" />
      </FormField>

      {/* Note log (edit only) */}
      {isEdit && task?.noteLog && task.noteLog.length > 0 && (
        <FormField label="Note Log">
          <div className="rounded p-2 max-h-24 overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
            {task.noteLog.map(n => (
              <div key={n.id} className="py-1 border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <span className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>
                  {new Date(n.createdAt).toLocaleDateString()} —{' '}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--ink2)' }}>{n.content}</span>
              </div>
            ))}
          </div>
        </FormField>
      )}

      <div className="flex gap-3 mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.claudeQueue}
            onChange={e => set('claudeQueue', e.target.checked)}
            style={{ accentColor: 'var(--purple)', width: 14, height: 14 }} />
          <span className="font-mono text-xs" style={{ color: 'var(--purple)' }}>→ Queue for Claude</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.recurring}
            onChange={e => set('recurring', e.target.checked)}
            style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
          <span className="font-mono text-xs" style={{ color: 'var(--ink2)' }}>↻ Recurring</span>
        </label>
      </div>

      <ModalFooter>
        {isEdit && onDelete && (
          <button className="btn-danger mr-auto" onClick={onDelete}>Delete</button>
        )}
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Task'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
