'use client'

import { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { BrainDumpAnalysis, BrainDumpSuggestion } from '@/lib/claude'

interface BrainDumpReviewProps {
  analysis: BrainDumpAnalysis
  onApprove: (selected: BrainDumpSuggestion[]) => Promise<void>
  onClose: () => void
}

export function BrainDumpReview({ analysis, onApprove, onClose }: BrainDumpReviewProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(analysis.suggestions.map((_, i) => i)))
  const [saving, setSaving] = useState(false)

  function toggle(i: number) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  async function handleApprove() {
    setSaving(true)
    const approved = analysis.suggestions.filter((_, i) => selected.has(i))
    await onApprove(approved)
    setSaving(false)
  }

  const typeColor: Record<string, string> = {
    task:        'var(--blue)',
    improvement: 'var(--gold)',
    note:        'var(--ink3)',
  }

  return (
    <Modal open={true} onClose={onClose} title="🤖 CLAUDE ANALYSIS — REVIEW & APPROVE" width="max-w-2xl">
      <div className="mb-4 rounded px-3 py-2" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
        <p className="font-mono text-xs" style={{ color: 'var(--ink2)' }}>
          <span style={{ color: 'var(--gold)' }}>Summary: </span>{analysis.summary}
        </p>
      </div>

      <p className="font-mono text-[10px] mb-3" style={{ color: 'var(--ink3)' }}>
        Review each suggestion below. Uncheck any you don't want to create. Click Approve to add selected items.
      </p>

      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {analysis.suggestions.map((s, i) => (
          <div
            key={i}
            className="flex gap-3 rounded p-3 cursor-pointer transition-all"
            style={{
              background: selected.has(i) ? 'rgba(240,165,0,.06)' : 'var(--bg)',
              border: `1px solid ${selected.has(i) ? 'rgba(240,165,0,.3)' : 'var(--line2)'}`,
            }}
            onClick={() => toggle(i)}
          >
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggle(i)}
              onClick={e => e.stopPropagation()}
              style={{ accentColor: 'var(--gold)', width: 14, height: 14, flexShrink: 0, marginTop: 2 }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm"
                  style={{ color: typeColor[s.type], background: `${typeColor[s.type]}18`, border: `1px solid ${typeColor[s.type]}40` }}>
                  {s.type}
                </span>
                <Badge variant={s.priority}>{s.priority.toUpperCase()}</Badge>
                {s.category && (
                  <span className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>{s.category}</span>
                )}
              </div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--ink)' }}>{s.title}</p>
              {s.description && (
                <p className="font-mono text-[10px] leading-relaxed mb-1" style={{ color: 'var(--ink2)' }}>{s.description}</p>
              )}
              {s.projectHint && (
                <p className="font-mono text-[9px]" style={{ color: 'var(--ink3)' }}>→ {s.projectHint}</p>
              )}
              <p className="font-mono text-[9px] mt-1 italic" style={{ color: 'var(--ink3)' }}>
                {s.reasoning}
                {s.urgency && s.impact ? ` · U${s.urgency}/I${s.impact}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ModalFooter>
        <span className="font-mono text-[10px] mr-auto" style={{ color: 'var(--ink3)' }}>
          {selected.size} of {analysis.suggestions.length} selected
        </span>
        <button className="btn" onClick={onClose}>Discard All</button>
        <button className="btn-gold" onClick={handleApprove} disabled={saving || selected.size === 0}>
          {saving ? 'Creating…' : `Approve ${selected.size} Items →`}
        </button>
      </ModalFooter>
    </Modal>
  )
}
