import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─── Brain Dump Analysis ──────────────────────────────────────────────────────
// Takes raw brain dump text and returns structured suggestions for CEO approval.

export interface BrainDumpSuggestion {
  type: 'task' | 'improvement' | 'note'
  title: string
  description?: string
  priority: 'p1' | 'p2' | 'p3'
  category?: string        // for improvements: product | process | workflow | technology
  projectHint?: string     // suggested project name to assign to
  urgency?: number         // 1–5
  impact?: number          // 1–5
  reasoning: string
}

export interface BrainDumpAnalysis {
  suggestions: BrainDumpSuggestion[]
  summary: string
  rawDump: string
}

export async function analyzeBrainDump(
  rawText: string,
  projectNames: string[],
): Promise<BrainDumpAnalysis> {
  const systemPrompt = `You are the AI operations assistant for Dalton Jones, CEO of Burke Truck & Equipment Inc.
Burke Truck builds and sells specialty trucks, snow plows, and related equipment.
Your job is to analyze CEO brain dumps and extract actionable items.

Current projects: ${projectNames.join(', ')}

For each distinct thought in the brain dump, classify it as:
- "task": something that needs to be done (add to project/kanban)
- "improvement": a process, product, workflow, or technology improvement idea
- "note": reference info that doesn't need action right now

Assign priority using Urgency × Impact logic:
- p1 (critical): high urgency AND high impact — needs action today
- p2 (standard): moderate urgency or impact — this week
- p3 (backlog): low urgency, future consideration

For urgency (1–5): 1=someday, 3=this week, 5=today
For impact (1–5): 1=minor, 3=meaningful, 5=game-changing

Always return valid JSON only. No preamble or explanation outside the JSON.`

  const userPrompt = `Brain dump to analyze:
---
${rawText}
---

Return JSON in this exact shape:
{
  "summary": "One sentence overview of what was dumped",
  "suggestions": [
    {
      "type": "task|improvement|note",
      "title": "Short action title",
      "description": "More detail if needed",
      "priority": "p1|p2|p3",
      "category": "product|process|workflow|technology (improvements only)",
      "projectHint": "closest matching project name or null",
      "urgency": 1-5,
      "impact": 1-5,
      "reasoning": "One sentence explaining priority assignment"
    }
  ]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const parsed = JSON.parse(content.text) as Omit<BrainDumpAnalysis, 'rawDump'>
  return { ...parsed, rawDump: rawText }
}

// ─── Task Prioritization ──────────────────────────────────────────────────────
// Re-evaluates all open tasks and returns priority/urgency suggestions.

export async function prioritizeTasks(tasks: {
  id: string
  title: string
  priority: string
  status: string
  dueDate?: Date | null
  notes?: string | null
  urgency?: number | null
  impact?: number | null
}[]): Promise<{ id: string; suggestedPriority: string; urgency: number; impact: number; reasoning: string }[]> {
  if (tasks.length === 0) return []

  const taskList = tasks.map(t =>
    `- ID: ${t.id} | "${t.title}" | status: ${t.status} | due: ${t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'none'} | notes: ${t.notes ?? 'none'}`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Re-evaluate these open CEO tasks for Burke Truck & Equipment. Today is ${new Date().toISOString().split('T')[0]}.

Tasks:
${taskList}

Return JSON array:
[{"id":"...","suggestedPriority":"p1|p2|p3","urgency":1-5,"impact":1-5,"reasoning":"..."}]

Only return the JSON array, nothing else.`,
    }],
    system: 'You are a CEO operations assistant. Evaluate tasks objectively using urgency × impact matrix. Return only valid JSON.',
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return JSON.parse(content.text)
}
