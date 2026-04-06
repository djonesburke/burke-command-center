import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'


const TASK_INCLUDE = {
  project: { select: { id: true, name: true, color: true, type: true } },
  noteLog: { orderBy: { createdAt: 'asc' as const } },
}

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(task)
}

// PUT /api/tasks/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session  = await getServerSession(authOptions)
  const apiKey   = req.headers.get('x-api-key')
  const isApiKey = apiKey === process.env.WEBHOOK_API_KEY
  if (!session && !isApiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = await prisma.task.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, priority, type, status, owner, dueDate, hours, nextAction,
          notes, claudeQueue, recurring, urgency, impact, projectId,
          odooRef, odooModel, newNote } = body

  // Append a note to the log if provided
  if (newNote) {
    await prisma.noteLogEntry.create({
      data: {
        taskId:  id,
        content: newNote,
        author:  session?.user?.email ?? 'claude',
      },
    })
  }

  const data: Record<string, unknown> = {}
  if (title       !== undefined) data.title       = title
  if (priority    !== undefined) data.priority    = priority
  if (type        !== undefined) data.type        = type
  if (status      !== undefined) data.status      = status
  if (owner       !== undefined) data.owner       = owner
  if (dueDate     !== undefined) data.dueDate     = dueDate ? new Date(dueDate) : null
  if (hours       !== undefined) data.hours       = hours ? parseFloat(hours) : null
  if (nextAction  !== undefined) data.nextAction  = nextAction
  if (notes       !== undefined) data.notes       = notes
  if (claudeQueue !== undefined) data.claudeQueue = claudeQueue
  if (recurring   !== undefined) data.recurring   = recurring
  if (urgency     !== undefined) data.urgency     = urgency ? parseInt(urgency) : null
  if (impact      !== undefined) data.impact      = impact  ? parseInt(impact)  : null
  if (projectId   !== undefined) data.projectId   = projectId
  if (odooRef     !== undefined) data.odooRef     = odooRef
  if (odooModel   !== undefined) data.odooModel   = odooModel

  const task = await prisma.task.update({
    where: { id },
    data,
    include: TASK_INCLUDE,
  })

  await audit({
    actor:    session?.user?.email ?? (isApiKey ? 'claude' : 'system'),
    action:   'update',
    table:    'tasks',
    recordId: task.id,
    before:   before as any,
    after:    task as any,
  })

  // Auto-recreate if recurring and just marked done
  if (task.status === 'done' && task.recurring && before.status !== 'done') {
    await prisma.task.create({
      data: {
        title:      task.title,
        priority:   task.priority,
        type:       task.type,
        status:     'todo',
        owner:      task.owner,
        nextAction: task.nextAction,
        notes:      task.notes,
        claudeQueue: task.claudeQueue,
        recurring:  true,
        urgency:    task.urgency,
        impact:     task.impact,
        projectId:  task.projectId,
        userId:     task.userId,
        source:     'manual',
      },
    })
  }

  return NextResponse.json(task)
}

// DELETE /api/tasks/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = await prisma.task.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.task.delete({ where: { id } })

  await audit({
    actor:    session.user.email,
    action:   'delete',
    table:    'tasks',
    recordId: id,
    before:   before as any,
  })

  return NextResponse.json({ success: true })
}
