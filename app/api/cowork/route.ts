import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [tasks, improvements, projects] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: 'done' } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: { project: { select: { name: true } } },
    }),
    prisma.improvement.findMany({
      where: { status: 'proposed' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const tasksByStatus = {
    todo:       tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'inprogress'),
    blocked:    tasks.filter(t => t.status === 'blocked'),
    waiting:    tasks.filter(t => t.status === 'waiting'),
    claudeQueue: tasks.filter(t => t.claudeQueue === true),
  }

  const today = new Date()
  const overdue = tasks.filter(
    t => t.dueDate && new Date(t.dueDate) < today
  )

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalActiveTasks:    tasks.length,
      overdueCount:        overdue.length,
      claudeQueueCount:    tasksByStatus.claudeQueue.length,
      activeProjects:      projects.length,
      pendingImprovements: improvements.length,
    },
    tasks: tasksByStatus,
    overdueTasks:  overdue,
    improvements,
    projects,
  })
}
