import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeBrainDump } from '@/lib/claude'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, projectNames } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  // Save dump first
  const dump = await prisma.brainDump.create({
    data: { content, userId: session.user.id },
  })

  // Run Claude analysis
  const analysis = await analyzeBrainDump(content, projectNames ?? [])

  // Store analysis result on the dump record
  await prisma.brainDump.update({
    where: { id: dump.id },
    data: { analysis: JSON.stringify(analysis), processed: true },
  })

  await audit({
    actor:    'claude',
    action:   'analyze',
    table:    'brain_dump',
    recordId: dump.id,
    after:    { suggestions: analysis.suggestions.length } as any,
    notes:    `Brain dump analyzed: ${analysis.suggestions.length} suggestions`,
  })

  return NextResponse.json({ ...analysis, dumpId: dump.id })
}
