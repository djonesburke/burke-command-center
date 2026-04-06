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

  const improvements = await prisma.improvement.findMany({
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(improvements)
}

export async function POST(req: NextRequest) {
  const session  = await getServerSession(authOptions)
  const apiKey   = req.headers.get('x-api-key')
  const isApiKey = apiKey === process.env.WEBHOOK_API_KEY
  if (!session && !isApiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, category, priority, impact, estimatedValue, urgency, impactScore } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const improvement = await prisma.improvement.create({
    data: {
      title,
      description:    description    ?? null,
      category:       category       ?? 'process',
      priority:       priority       ?? 'p2',
      status:         'proposed',
      impact:         impact         ?? null,
      estimatedValue: estimatedValue ?? null,
      urgency:        urgency        ? parseInt(urgency)     : null,
      impactScore:    impactScore    ? parseInt(impactScore) : null,
      submittedBy:    session?.user?.email ?? 'claude',
    },
  })

  await audit({
    actor:    session?.user?.email ?? 'claude',
    action:   'create',
    table:    'improvements',
    recordId: improvement.id,
    after:    improvement as any,
  })

  return NextResponse.json(improvement, { status: 201 })
}
