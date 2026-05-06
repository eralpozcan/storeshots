// Generates N alternative copy variants for the same set of slides so the
// user can A/B test tone-of-voice without re-running the full vision pipeline.
// Mirrors the BYOK pattern of /api/generate-copy.

const MAX_BODY_BYTES = 2 * 1024 * 1024
const MAX_SLIDES = 12
const MAX_COUNT = 5

type Slide = { label: string, headline: string }

const SYSTEM_PROMPT = `You are an expert App Store / Google Play copywriter producing A/B test variations.

Given a base set of slides, return MULTIPLE alternative versions of the same slides — same idea per slide but different angle, tone, or rhythm. The user will pick the variant that resonates.

Rules:
- Keep slide ORDER and COUNT identical.
- Maximum 5 words per line, 2 lines per headline (use \\n between lines).
- One idea per slide. Never join two things with "and".
- Sell feelings and outcomes, not features.
- Labels stay 1-3 words ALL CAPS.
- Each variant should feel meaningfully different in tone:
  - variant 1: confident / direct
  - variant 2: warm / human
  - variant 3: punchy / playful

Return ONLY a JSON object, no markdown, no explanation. Shape:
{ "variants": [ [{"label":"LABEL","headline":"Line one\\nLine two"}, ...], ... ] }`

function ensureString(v: unknown, field: string, max: number, required = true): string {
  if (v == null || v === '') {
    if (required) throw createError({ statusCode: 400, statusMessage: `Missing field: ${field}` })
    return ''
  }
  if (typeof v !== 'string') throw createError({ statusCode: 400, statusMessage: `Field "${field}" must be a string` })
  if (v.length > max) throw createError({ statusCode: 413, statusMessage: `Field "${field}" too long` })
  return v
}

function parseSlides(value: unknown): Slide[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'baseCopy must be a non-empty array' })
  }
  if (value.length > MAX_SLIDES) {
    throw createError({ statusCode: 400, statusMessage: 'Too many slides' })
  }
  return value.map((s, i) => {
    if (!s || typeof s !== 'object') throw createError({ statusCode: 400, statusMessage: `baseCopy[${i}] invalid` })
    const label = ensureString((s as any).label, `baseCopy[${i}].label`, 100, false) || 'FEATURE'
    const headline = ensureString((s as any).headline, `baseCopy[${i}].headline`, 400, false)
    return { label, headline }
  })
}

function tryParseJson(text: string): any {
  try { return JSON.parse(text) }
  catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Provider returned non-JSON content')
  }
}

export default defineEventHandler(async (event) => {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) throw createError({ statusCode: 413, statusMessage: 'Request body too large' })

  const body = await readBody(event)
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400, statusMessage: 'Invalid body' })

  const provider = ensureString(body.provider, 'provider', 32)
  if (provider !== 'claude' && provider !== 'openrouter') {
    throw createError({ statusCode: 400, statusMessage: 'provider must be "claude" or "openrouter"' })
  }
  const apiKey = ensureString(body.apiKey, 'apiKey', 512)
  const openrouterModel = ensureString(body.openrouterModel, 'openrouterModel', 128, false)
  const claudeModel = ensureString(body.claudeModel, 'claudeModel', 64, false) || 'claude-sonnet-4-6'
  const locale = ensureString(body.locale ?? 'en', 'locale', 8, false)
  const baseCopy = parseSlides(body.baseCopy)
  const count = Math.min(MAX_COUNT, Math.max(1, Number(body.count ?? 3)))
  if (!Number.isInteger(count)) throw createError({ statusCode: 400, statusMessage: 'count must be an integer' })

  const userPrompt = `Locale: ${locale}
Number of variants requested: ${count}

Base slides (current copy):
${JSON.stringify(baseCopy, null, 2)}`

  let raw = ''
  if (provider === 'claude') {
    const res = await $fetch<any>('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: claudeModel,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      },
    })
    raw = res.content?.[0]?.text ?? ''
  }
  else {
    const model = openrouterModel || 'anthropic/claude-3-5-sonnet'
    const res = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://storeshots.org',
        'X-Title': 'Storeshots Variants',
      },
      body: {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
      },
    })
    raw = res.choices?.[0]?.message?.content ?? ''
  }

  const parsed = tryParseJson(raw)
  const variants: Slide[][] = Array.isArray(parsed?.variants)
    ? parsed.variants.slice(0, count).map((v: any) =>
      Array.isArray(v)
        ? v.slice(0, baseCopy.length).map((s: any) => ({
          label: typeof s?.label === 'string' ? s.label : '',
          headline: typeof s?.headline === 'string' ? s.headline : '',
        }))
        : [],
    )
    : []

  return { variants }
})
