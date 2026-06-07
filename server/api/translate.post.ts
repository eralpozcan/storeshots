// Translate existing slide copy into other languages. Unlike generate-copy
// (which derives headlines from screenshots), this takes copy the user already
// has and translates it 1:1, preserving slide order and the label/headline
// structure. Used by the Translations manager's "translate from existing".

const LOCALE_NAMES: Record<string, string> = {
  en: 'English', tr: 'Turkish', de: 'German', fr: 'French',
  es: 'Spanish', pt: 'Portuguese (Brazil)', 'pt-PT': 'Portuguese (Portugal)',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', ar: 'Arabic',
  zh: 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
  nl: 'Dutch', ru: 'Russian', hi: 'Hindi', id: 'Indonesian',
  pl: 'Polish', sv: 'Swedish', da: 'Danish', no: 'Norwegian',
  fi: 'Finnish', cs: 'Czech', ro: 'Romanian', uk: 'Ukrainian',
  vi: 'Vietnamese', th: 'Thai', hu: 'Hungarian',
}

const SYSTEM_PROMPT = `You are an expert App Store / Google Play localization specialist.
You translate marketing screenshot copy. Keep it punchy and idiomatic — translate the MEANING, not word-for-word.

Rules:
- Keep the same number of slides and the same slide order.
- For each slide: translate "label" (1-3 words, ALL CAPS) and "headline".
- Headlines: max 5 words per line, max 2 lines. Preserve "\\n" line breaks where natural.
- Keep proper nouns / brand names untranslated.
- Output only valid JSON, no markdown, no commentary.`

function buildPrompt(sourceLang: string, targets: { code: string; name: string }[], slides: { label: string; headline: string }[]): string {
  const targetList = targets.map((t, i) => `${i + 1}. ${t.name} (${t.code})`).join('\n')
  return `Source language: ${sourceLang}
Source slides (JSON):
${JSON.stringify(slides, null, 2)}

Translate ALL slides into each of these target languages:
${targetList}

Return ONLY this JSON shape, no markdown:
{
  "locales": {
    "<locale_code>": [{"label":"LABEL","headline":"Line one\\nLine two"}, ...]
  }
}
Each locale array MUST have exactly ${slides.length} slides in the same order as the source.`
}

function parseLooseJson(raw: string): any {
  try {
    return JSON.parse(raw)
  } catch {
    const repaired = raw
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      .replace(/[\x00-\x1F]+/g, ' ')
    return JSON.parse(repaired)
  }
}

function ensureString(v: unknown, field: string, max: number, required = true): string {
  if (v == null || v === '') {
    if (required) throw createError({ statusCode: 400, statusMessage: `Missing field: ${field}` })
    return ''
  }
  if (typeof v !== 'string') throw createError({ statusCode: 400, statusMessage: `Field "${field}" must be a string` })
  if (v.length > max) throw createError({ statusCode: 413, statusMessage: `Field "${field}" too long` })
  return v
}

const MAX_BODY_BYTES = 2 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Request body too large' })
  }

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const provider = ensureString(body.provider, 'provider', 32)
  if (provider !== 'claude' && provider !== 'openrouter') {
    throw createError({ statusCode: 400, statusMessage: 'provider must be "claude" or "openrouter"' })
  }
  const apiKey = ensureString(body.apiKey, 'apiKey', 512)
  const openrouterModel = ensureString(body.openrouterModel, 'openrouterModel', 128, false)
  const claudeModel = ensureString(body.claudeModel, 'claudeModel', 64, false) || 'claude-sonnet-4-6'
  const sourceLocale = ensureString(body.sourceLocale, 'sourceLocale', 8)

  if (!Array.isArray(body.targetLocales) || !body.targetLocales.length) {
    throw createError({ statusCode: 400, statusMessage: 'targetLocales must be a non-empty array' })
  }
  if (body.targetLocales.length > 28) {
    throw createError({ statusCode: 400, statusMessage: 'Too many target locales (max 28)' })
  }
  const targetLocales: string[] = body.targetLocales.map((l: unknown, i: number) => {
    if (typeof l !== 'string' || l.length > 8) throw createError({ statusCode: 400, statusMessage: `targetLocales[${i}] invalid` })
    return l
  })

  if (!Array.isArray(body.slides) || !body.slides.length) {
    throw createError({ statusCode: 400, statusMessage: 'slides must be a non-empty array' })
  }
  if (body.slides.length > 12) {
    throw createError({ statusCode: 400, statusMessage: 'Too many slides (max 12)' })
  }
  const slides = body.slides.map((s: any, i: number) => ({
    label: ensureString(s?.label, `slides[${i}].label`, 200, false),
    headline: ensureString(s?.headline, `slides[${i}].headline`, 600, false),
  }))

  const sourceLang = LOCALE_NAMES[sourceLocale] || sourceLocale
  const targets = targetLocales.map(c => ({ code: c, name: LOCALE_NAMES[c] || c }))
  const userPrompt = buildPrompt(sourceLang, targets, slides)

  async function call(): Promise<string> {
    const maxTokens = Math.min(targetLocales.length * slides.length * 80 + 512, 8192)
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
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        },
      })
      return res.content?.[0]?.text ?? ''
    }
    const model = openrouterModel || 'anthropic/claude-sonnet-4.6'
    const res = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/screenshot-generator',
        'X-Title': 'App Store Screenshot Generator',
      },
      body: {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
      },
    })
    return res.choices?.[0]?.message?.content ?? ''
  }

  try {
    const responseText = await call()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw createError({ statusCode: 502, statusMessage: 'Could not parse translation response' })
    const parsed = parseLooseJson(jsonMatch[0])
    return { locales: parsed.locales || {} }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: String(err) })
  }
})
