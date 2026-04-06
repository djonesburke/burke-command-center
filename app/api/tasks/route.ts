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

// GET /api/tasks — list all tasks (non-archived)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tasks = await prisma.task.findMany({
    where: { status: { not: 'archived' } },
    include: TASK_INCLUDE,
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(tasks)
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  // Also allow webhook API key for external task creation (bookmarklet, Claude, email)
  const apiKey = req.headers.get('x-api-key')
  const isWebhook = apiKey === process.env.WEBHOOK_API_KEY

  if (!session && !isWebhook) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, priority, type, status, owner, dueDate, hours, nextAction,
          notes, claudeQueue, recurring, urgency, impact, projectId, source,
          odooRef, odooModel } = body

  if (!title || !projectId) {
    return NextResponse.json({ error: 'title and projectId are required' }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      title, projectId,
      priority:    priority    ?? 'p2',
      type:        type        ?? 'internal',
      status:      status      ?? 'todo',
      owner:       owner       ?? session?.user?.name ?? null,
      dueDate:     dueDate     ? new Date(dueDate) : null,
      hours:       hours       ? parseFloat(hours) : null,
      nextAction:  nextAction  ?? null,
      notes:       notes       ?? null,
      claudeQueue: claudeQueue ?? false,
      recurring:   recurring   ?? false,
      urgency:     urgency     ? parseInt(urgency) : null,
      impact:      impact      ? parseInt(impact)  : null,
      source:      source      ?? (isWebhook ? 'webhook' : 'manual'),
      odooRef:     odooRef     ?? null,
      odooModel:   odooModel   ?? null,
      userId:      session?.user?.id ?? null,
    },
    include: TASK_INCLUDE,
  })

  await audit({
    actor:    session?.user?.email ?? 'webhook',
    action:   'create',
    table:    'tasks',
    recordId: task.id,
    after:    task as any,
  })

  return NextResponse.json(task, { status: 201 })
}
