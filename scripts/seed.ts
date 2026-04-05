/**
 * Burke CEO Command Center — Seed Script
 *
 * Migrates existing data/tasks.json into PostgreSQL.
 * Also creates the CEO user with email/password backup.
 *
 * Run: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Burke CEO Command Center...\n')

  // ── 1. Create CEO user (email/password backup) ────────────────
  const ceoEmail = process.env.CEO_EMAIL ?? 'dalton@burketruck.com'
  const rawPass  = process.env.CEO_INITIAL_PASSWORD ?? 'ChangeMe2025!'
  const hashed   = await bcrypt.hash(rawPass, 12)

  const ceo = await prisma.user.upsert({
    where:  { email: ceoEmail },
    update: { role: 'ceo', active: true },
    create: {
      email:    ceoEmail,
      name:     'Dalton Jones',
      role:     'ceo',
      password: hashed,
      active:   true,
    },
  })
  console.log(`✓ CEO user: ${ceo.email}`)

  // ── 2. Load existing tasks.json ───────────────────────────────
  const jsonPath = path.join(__dirname, '../data/tasks.json')
  if (!fs.existsSync(jsonPath)) {
    console.log('⚠ No data/tasks.json found — skipping migration')
    return
  }

  const raw  = fs.readFileSync(jsonPath, 'utf-8')
  const json = JSON.parse(raw)

  // ── 3. Seed projects ──────────────────────────────────────────
  const projectMap = new Map<string, string>() // old id → new id

  for (const p of (json.projects ?? [])) {
    const proj = await prisma.project.upsert({
      where:  { id: p.id },
      update: {},
      create: {
        id:          p.id,
        name:        p.name,
        description: p.description ?? null,
        type:        p.type ?? 'internal',
        priority:    p.priority ?? 'p2',
        status:      p.status ?? 'active',
        color:       p.color ?? '#F0A500',
      },
    })
    projectMap.set(p.id, proj.id)
    console.log(`✓ Project: ${proj.name}`)
  }

  // ── 4. Seed tasks (active) ────────────────────────────────────
  async function seedTask(t: any) {
    const projId = projectMap.get(t.project_id) ?? projectMap.get(t.projectId)
    if (!projId) { console.warn(`  ⚠ No project for task "${t.title}" — skipping`); return }

    await prisma.task.upsert({
      where:  { id: t.id },
      update: {},
      create: {
        id:          t.id,
        title:       t.title,
        priority:    t.priority ?? 'p2',
        type:        t.type ?? 'internal',
        status:      t.status ?? 'todo',
        owner:       t.owner ?? null,
        dueDate:     t.due ? new Date(t.due) : null,
        hours:       t.hours ? parseFloat(t.hours) : null,
        nextAction:  t.next_action ?? null,
        notes:       t.notes ?? null,
        claudeQueue: t.claude ?? false,
        recurring:   t.recurring ?? false,
        source:      'manual',
        projectId:   projId,
        userId:      ceo.id,
      },
    })
    console.log(`  ✓ Task: ${t.title}`)
  }

  for (const t of (json.tasks    ?? [])) await seedTask(t)
  for (const t of (json.archived ?? [])) await seedTask({ ...t, status: 'done' })

  // ── 5. Seed brain dumps ───────────────────────────────────────
  for (const content of (json.brain_dump ?? [])) {
    if (!content) continue
    await prisma.brainDump.create({
      data: { content, userId: ceo.id },
    })
  }
  if ((json.brain_dump ?? []).length > 0) {
    console.log(`✓ Brain dumps: ${json.brain_dump.length} migrated`)
  }

  console.log('\n✅ Seed complete!')
  console.log('\n⚠  IMPORTANT: Change your initial password on first login!')
  console.log(`   Email:    ${ceoEmail}`)
  console.log(`   Password: ${rawPass}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
