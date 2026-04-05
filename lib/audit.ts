import { prisma } from '@/lib/db'

type Actor = string // user email, "claude", or "system"
type Action = 'create' | 'update' | 'delete' | 'analyze' | 'approve' | 'reject'
type Table = 'tasks' | 'projects' | 'improvements' | 'brain_dump' | 'users'

export async function audit(params: {
  actor: Actor
  action: Action
  table: Table
  recordId: string
  before?: object | null
  after?: object | null
  notes?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor:     params.actor,
        action:    params.action,
        tableName: params.table,
        recordId:  params.recordId,
        before:    params.before ?? undefined,
        after:     params.after  ?? undefined,
        notes:     params.notes,
      },
    })
  } catch (err) {
    // Audit log failure should never break the main operation — log but don't throw
    console.error('[audit] Failed to write audit log:', err)
  }
}
