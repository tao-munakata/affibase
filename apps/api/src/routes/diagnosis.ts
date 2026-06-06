import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sql } from '../db/client'

const app = new Hono()

const diagnosisSchema = z.object({
  theme_slug: z.string(),
  answers: z.object({
    age: z.enum(['10s', '20s', '30s', '40s', '50s_plus']),
    job: z.enum(['office', 'service', 'engineer', 'creative', 'student', 'other']),
    reason: z.array(z.string()),
    time: z.enum(['30m', '1h', '2h', '3h_plus']),
    skills: z.array(z.string()),
    goal: z.enum(['10k', '30k', '50k', '100k', '300k_plus']),
  }),
})

// Public diagnosis endpoint — AI agents can POST here
app.post('/', zValidator('json', diagnosisSchema), async (c) => {
  const { theme_slug, answers } = c.req.valid('json')

  const [theme] = await sql`SELECT id FROM themes WHERE slug = ${theme_slug} AND is_active = true`
  if (!theme) return c.json({ error: 'Theme not found' }, 404)

  // Build pattern key (best match logic)
  const patternKey = `time:${answers.time},skill:${answers.skills[0] ?? 'other'},goal:${answers.goal}`

  let [pattern] = await sql`
    SELECT dp.*, array_agg(o.*) as offers
    FROM diagnosis_patterns dp
    LEFT JOIN offers o ON o.id = ANY(dp.recommended_offers) AND o.status = 'active'
    WHERE dp.theme_id = ${theme.id} AND dp.pattern_key = ${patternKey}
    GROUP BY dp.id
  `

  // Fallback to first pattern if no exact match
  if (!pattern) {
    ;[pattern] = await sql`
      SELECT dp.*, array_agg(o.*) as offers
      FROM diagnosis_patterns dp
      LEFT JOIN offers o ON o.id = ANY(dp.recommended_offers) AND o.status = 'active'
      WHERE dp.theme_id = ${theme.id}
      GROUP BY dp.id
      LIMIT 1
    `
  }

  if (!pattern) return c.json({ error: 'No diagnosis patterns available' }, 404)

  return c.json({
    result: {
      title: pattern.result_title,
      description: pattern.result_description,
      icon: pattern.result_icon,
      faq: pattern.aeo_faq,
    },
    offers: pattern.offers?.filter(Boolean) ?? [],
    pattern_key: patternKey,
  })
})

export default app
