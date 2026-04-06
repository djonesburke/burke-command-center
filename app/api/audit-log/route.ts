import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // CEO-only
  if (session.user.role !== 'ceo' && session.user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url    = new URL(req.url)
  const page   = parseInt(url.searchParams.get('page')  ?? '1')
  const limit  = parseInt(url.searchParams.get('limit') ?? '50')
  const actor  = url.searchParams.get('actor')  ?? undefined
  const table  = url.searchParams.get('table')  ?? undefined
  const action = url.searchParams.get('action') ?? undefined

  const where = {
    ...(actor  ? { actor  } : {}),
    ...(table  ? { tableName: table  } : {}),
    ...(action ? { action } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, limit })
}
