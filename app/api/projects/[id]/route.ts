import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = await prisma.project.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, type, priority, status, color } = body

  const project = await prisma.project.update({
    where: { id },
    data: { name, description, type, priority, status, color },
    include: { _count: { select: { tasks: true } } },
  })

  await audit({ actor: session.user.email, action: 'update', table: 'tasks', recordId: project.id, before: before as any, after: project as any })

  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Don't allow delete if tasks exist
  const count = await prisma.task.count({ where: { projectId: id } })
  if (count > 0) {
    return NextResponse.json({ error: 'Cannot delete project with tasks. Archive or reassign tasks first.' }, { status: 400 })
  }

  const before = await prisma.project.findUnique({ where: { id } })
  await prisma.project.delete({ where: { id } })
  await audit({ actor: session.user.email, action: 'delete', table: 'tasks', recordId: id, before: before as any })

  return NextResponse.json({ success: true })
}
