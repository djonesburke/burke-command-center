/**
 * POST /api/webhook
 *
 * External task/improvement creation endpoint.
 * Used by:
 *   - Browser bookmarklet (sends page URL + selected text + note)
 *   - Claude (via claude.ai chat, reading emails, Cowork context)
 *   - Future: Odoo webhooks, Gmail rules
 *
 * Auth: x-api-key header must match WEBHOOK_API_KEY env var
 *
 * Body:
 * {
 *   type: "task" | "improvement",
 *   title: string,
 *   description?: string,
 *   priority?: "p1"|"p2"|"p3",
 *   projectId?: string,       // task only
 *   category?: string,        // improvement only
 *   source?: string,          // "email"|"browser"|"claude"|"odoo"
 *   sourceUrl?: string,       // page URL if from browser
 *   sourceContext?: string,   // selected text or email snippet
 * }
 */

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, title, description, priority, projectId, category, source, sourceUrl, sourceContext } = body

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const actor = source === 'claude' ? 'claude' : `webhook:${source ?? 'unknown'}`

  if (type === 'improvement') {
    const improvement = await prisma.improvement.create({
      data: {
        title,
        description: description ?? sourceContext ?? null,
        category:    category ?? 'process',
        priority:    priority ?? 'p2',
        status:      'proposed',
        submittedBy: actor,
      },
    })
    await audit({ actor, action: 'create', table: 'improvements', recordId: improvement.id, after: improvement as any, notes: `Source: ${source ?? 'webhook'}` })
    return NextResponse.json({ created: 'improvement', id: improvement.id }, { status: 201 })
  }

  // Default: task
  // Find first active project if none specified
  const resolvedProjectId = projectId ?? (await prisma.project.findFirst({
    where: { status: { not: 'archived' } },
    orderBy: { priority: 'asc' },
  }))?.id

  if (!resolvedProjectId) return NextResponse.json({ error: 'No project found' }, { status: 400 })

  // Build notes with source context
  const notes = [
    description ?? '',
    sourceContext ? `Context: ${sourceContext}` : '',
    sourceUrl    ? `Source: ${sourceUrl}` : '',
  ].filter(Boolean).join('\n\n') || null

  const task = await prisma.task.create({
    data: {
      title,
      priority:   priority ?? 'p2',
      type:       'internal',
      status:     'todo',
      notes,
      source:     source ?? 'webhook',
      projectId:  resolvedProjectId,
      claudeQueue: source === 'claude',
      odooRef:    null,
      odooModel:  null,
    },
    include: {
      project: { select: { id: true, name: true, color: true, type: true } },
      noteLog: true,
    },
  })

  await audit({ actor, action: 'create', table: 'tasks', recordId: task.id, after: task as any, notes: `Source: ${source ?? 'webhook'}` })

  return NextResponse.json({ created: 'task', id: task.id, task }, { status: 201 })
}
