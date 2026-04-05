// Shared TypeScript types across the app

export type Priority = 'p1' | 'p2' | 'p3'
export type TaskStatus = 'todo' | 'inprogress' | 'blocked' | 'waiting' | 'done'
export type ProjectStatus = 'active' | 'inprogress' | 'todo' | 'done' | 'archived'
export type TaskType = 'internal' | 'external' | 'odoo'
export type ImprovementCategory = 'product' | 'process' | 'workflow' | 'technology'
export type ImprovementStatus = 'proposed' | 'reviewing' | 'approved' | 'implementing' | 'done' | 'rejected'
export type UserRole = 'ceo' | 'manager' | 'member'

export interface TaskWithProject {
  id: string
  title: string
  priority: string
  type: string
  status: string
  owner: string | null
  dueDate: Date | null
  hours: number | null
  nextAction: string | null
  notes: string | null
  claudeQueue: boolean
  recurring: boolean
  urgency: number | null
  impact: number | null
  source: string
  odooRef: string | null
  odooModel: string | null
  projectId: string
  userId: string | null
  createdAt: Date
  updatedAt: Date
  project: {
    id: string
    name: string
    color: string
    type: string
  }
  noteLog: {
    id: string
    content: string
    author: string | null
    createdAt: Date
  }[]
}

export interface ProjectWithStats {
  id: string
  name: string
  description: string | null
  type: string
  priority: string
  status: string
  color: string
  urgency: number | null
  impact: number | null
  odooRef: string | null
  odooModel: string | null
  createdAt: Date
  updatedAt: Date
  _count: { tasks: number }
  taskStats?: {
    total: number
    done: number
    p1: number
    overdue: number
  }
}

// Extend next-auth session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      department: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: string
    department: string | null
  }
}
