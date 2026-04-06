import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// POST /api/tasks/archive-done — move all done tasks to archived status
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await prisma.task.updateMany({
    where: { status: 'done' },
    data:  { status: 'archived' },
  })

  await audit({
    actor:    session.user.email,
    action:   'update',
    table:    'tasks',
    recordId: 'bulk',
    notes:    `Archived ${result.count} done tasks`,
  })

  return NextResponse.json({ archived: result.count })
}
