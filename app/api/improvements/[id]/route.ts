import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = await prisma.improvement.findUnique({ where: { id: params.id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const improvement = await prisma.improvement.update({ where: { id: params.id }, data: body })

  await audit({ actor: session.user.email, action: 'update', table: 'improvements', recordId: params.id, before: before as any, after: improvement as any })
  return NextResponse.json(improvement)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = await prisma.improvement.findUnique({ where: { id: params.id } })
  await prisma.improvement.delete({ where: { id: params.id } })
  await audit({ actor: session.user.email, action: 'delete', table: 'improvements', recordId: params.id, before: before as any })
  return NextResponse.json({ success: true })
}
