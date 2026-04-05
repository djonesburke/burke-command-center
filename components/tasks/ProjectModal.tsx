'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalFooter, FormField } from '@/components/ui/Modal'

interface ProjectFormData {
  name: string
  description: string
  type: string
  priority: string
  status: string
  color: string
}

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  project?: { id: string } & ProjectFormData | null
  onSave: (data: ProjectFormData) => Promise<void>
  onDelete?: () => Promise<void>
}

const empty: ProjectFormData = {
  name: '', description: '', type: 'internal',
  priority: 'p2', status: 'active', color: '#F0A500',
}

export function ProjectModal({ open, onClose, project, onSave, onDelete }: ProjectModalProps) {
  const [form, setForm]   = useState<ProjectFormData>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(project ? {
      name: project.name, description: project.description ?? '',
      type: project.type, priority: project.priority,
      status: project.status, color: project.color,
    } : empty)
  }, [project, open])

  function set(key: keyof ProjectFormData, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={project ? 'EDIT PROJECT' : '+ NEW PROJECT'}>
      <FormField label="Name *">
        <input className="field-input" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Project name…" />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <select className="field-select" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="odoo">Odoo</option>
          </select>
        </FormField>
        <FormField label="Priority">
          <select className="field-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="p1">🔴 P1 Critical</option>
            <option value="p2">🟡 P2 Standard</option>
            <option value="p3">🟢 P3 Backlog</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status">
          <select className="field-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inprogress">In Progress</option>
            <option value="todo">Planned</option>
            <option value="done">Complete</option>
            <option value="archived">Archived</option>
          </select>
        </FormField>
        <FormField label="Color">
          <input className="field-input" type="color" value={form.color}
            onChange={e => set('color', e.target.value)}
            style={{ padding: 4, cursor: 'pointer', height: 38 }} />
        </FormField>
      </div>

      <FormField label="Description">
        <textarea className="field-textarea" value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="What is this project about?" />
      </FormField>

      <ModalFooter>
        {project && onDelete && (
          <button className="btn-danger mr-auto" onClick={onDelete}>Delete Project</button>
        )}
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-gold" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Project'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
