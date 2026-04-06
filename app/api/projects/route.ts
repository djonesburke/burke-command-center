import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const apiKey = req.headers.get('x-api-key')
  const isApiKeyAuth = apiKey && apiKey === process.env.WEBHOOK_API_KEY

  if (!session && !isApiKeyAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await prisma.project.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })

  // Attach task stats
  const withStats = await Promise.all(projects.map(async p => {
    const tasks = await prisma.task.findMany({
      where: { projectId: p.id },
      select: { status: true, priority: true, dueDate: true },
    })
    const now = new Date()
    return {
      ...p,
      taskStats: {
        total:   tasks.length,
        done:    tasks.filter(t => t.status === 'done').length,
        p1:      tasks.filter(t => t.priority === 'p1' && t.status !== 'done').length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      },
    }
  }))

  return NextResponse.json(withStats)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, type, priority, status, color } = await req.json()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      type:        type        ?? 'internal',
      priority:    priority    ?? 'p2',
      status:      status      ?? 'active',
      color:       color       ?? '#F0A500',
    },
    include: { _count: { select: { tasks: true } } },
  })

  await audit({ actor: session.user.email, action: 'create', table: 'tasks', recordId: project.id, after: project as any })

  return NextResponse.json({ ...project, taskStats: { total: 0, done: 0, p1: 0, overdue: 0 } }, { status: 201 })
}
