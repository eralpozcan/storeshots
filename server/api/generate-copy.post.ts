const ORDERING_RULES = `
CRITICAL — Slide ordering for maximum conversion:
You MUST reorder the slides for best App Store / Google Play performance.
The first 3 screenshots are visible without scrolling — they decide if users download.

Optimal order:
1. HERO — The single strongest benefit. Must convince in 1 second.
2. PRIMARY FEATURE — The most-used or most-loved feature.
3. DIFFERENTIATOR — What makes this app unique vs competitors, or social proof.
4-N. SUPPORTING FEATURES — Other features, one per slide, descending importance.
Last. TRUST / CLOSING — "Join X users", "Built for...", emotional CTA.

Each slide must include "imageIndex" — the 0-based index of the ORIGINAL uploaded image to use for that slide position. This lets us reorder slides while keeping the correct screenshot matched.
If a slide has no matching image (e.g. the closing trust slide), set imageIndex to null.`

const COPY_SYSTEM_PROMPT = `You are an expert App Store copywriter and ASO strategist. You will receive app screenshots (images) along with app info. Analyze each screenshot, then write headlines AND determine the optimal ordering for conversion.

Rules:
- Maximum 5 words per line, 2 lines per headline
- One idea per slide. Never join two things with "and"
- Sell feelings and outcomes, not features
- The label is 1-3 words in ALL CAPS describing what's shown in the screenshot
- If no image is provided for a slide, write a generic benefit headline
${ORDERING_RULES}

Respond ONLY with a JSON array, no markdown, no explanation:
[{"label":"LABEL","headline":"Line one\\nLine two","imageIndex":0},...]`

const DESIGN_SYSTEM_PROMPT = `You are an expert App Store designer, copywriter, and ASO strategist. You will receive app screenshots (images) along with app info. Analyze each screenshot to understand the app's visual identity and features, then generate a complete design system with optimal slide ordering.

Return a JSON object with:
1. "slides" — array of slide objects with label, headline, and imageIndex (reordered for best conversion)
2. "colors" — brand color palette derived from the screenshots' UI
${ORDERING_RULES}

Rules for headlines:
- Maximum 5 words per line, 2 lines per headline
- One idea per slide
- Analyze each screenshot to understand the feature shown

Rules for colors:
- Extract dominant colors from the screenshots if possible
- primary: main brand color (hex)
- accent: complementary highlight (hex)
- textDark: dark text for light backgrounds (hex)
- textLight: light text for dark backgrounds (hex)
- bgFrom: dark gradient start (hex)
- bgTo: dark gradient end (hex)

Respond ONLY with JSON, no markdown:
{
  "slides": [{"label":"LABEL","headline":"Line one\\nLine two","imageIndex":0}, ...],
  "colors": {"primary":"#hex","accent":"#hex","textDark":"#hex","textLight":"#hex","bgFrom":"#hex","bgTo":"#hex"}
}`

const LOCALE_NAMES: Record<string, string> = {
  en: 'English', tr: 'Turkish', de: 'German', fr: 'French',
  es: 'Spanish', pt: 'Portuguese', it: 'Italian', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', zh: 'Chinese', nl: 'Dutch', ru: 'Russian',
}

function buildUserPrompt(appName: string, appDescription: string, features: string[], slideCount: number, locale: string, imageCount: number): string {
  const lang = LOCALE_NAMES[locale] || 'English'

  let imageNote: string
  if (imageCount > 0) {
    imageNote = `IMPORTANT: I have attached ${imageCount} app screenshots in order (image 1 = slide 1, image 2 = slide 2, etc.).
The app UI is in ${lang}. Analyze each screenshot carefully:
- Look at the screen content, navigation, UI elements, and data shown
- Write a headline that sells the SPECIFIC feature visible in THAT screenshot
- The label should describe what that particular screen shows
- Match the output language to ${lang}
- Slide ${imageCount + 1} onwards (if any) should be generic benefit headlines`
  } else {
    imageNote = 'No screenshots provided — write headlines based on the app description and features.'
  }

  return `App name: ${appName}
Description: ${appDescription || 'A mobile app'}
Top features (in priority order): ${features.join(', ') || 'core features'}
Number of slides: ${slideCount}
Output language: ${lang} (ALL headlines and labels MUST be in ${lang})

${imageNote}

Narrative arc:
- Slide 1: Hero / Main benefit (strongest selling point)
- Slides 2-${Math.max(slideCount - 1, 2)}: One feature per slide (match to screenshots)
- Last slide: Trust / closing message ("Made for...", "Join...", etc.)`
}

function buildMessages(systemPrompt: string, userPrompt: string, images: string[], provider: string) {
  if (provider === 'claude') {
    // Claude Messages API: images as content blocks
    const content: any[] = []
    for (const img of images) {
      const match = img.match(/^data:(image\/\w+);base64,(.+)$/)
      if (match) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: match[1], data: match[2] },
        })
      }
    }
    content.push({ type: 'text', text: userPrompt })
    return {
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }
  }

  // OpenRouter: OpenAI-compatible vision format
  const content: any[] = []
  for (const img of images) {
    content.push({ type: 'image_url', image_url: { url: img } })
  }
  content.push({ type: 'text', text: userPrompt })
  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
  }
}

// Hard upper bound on the request body. Images are base64-encoded slides at
// roughly 50–200KB each; ten slides plus prompt fields fit well under 8MB.
// Anything larger is almost certainly abuse.
const MAX_BODY_BYTES = 8 * 1024 * 1024

function ensureString(v: unknown, field: string, max: number, required = true): string {
  if (v == null || v === '') {
    if (required) throw createError({ statusCode: 400, statusMessage: `Missing field: ${field}` })
    return ''
  }
  if (typeof v !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `Field "${field}" must be a string` })
  }
  if (v.length > max) {
    throw createError({ statusCode: 413, statusMessage: `Field "${field}" too long` })
  }
  return v
}

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
  const appName = ensureString(body.appName, 'appName', 200, false)
  const appDescription = ensureString(body.appDescription, 'appDescription', 4000, false)
  const locale = ensureString(body.locale ?? 'en', 'locale', 8, false)

  // features is a list of short bullet strings collected from the editor.
  let features: string[] = []
  if (body.features != null) {
    if (!Array.isArray(body.features)) {
      throw createError({ statusCode: 400, statusMessage: 'features must be an array of strings' })
    }
    if (body.features.length > 50) {
      throw createError({ statusCode: 400, statusMessage: 'Too many features' })
    }
    features = body.features.map((f: unknown, i: number) => {
      if (typeof f !== 'string') {
        throw createError({ statusCode: 400, statusMessage: `features[${i}] must be a string` })
      }
      if (f.length > 500) {
        throw createError({ statusCode: 413, statusMessage: `features[${i}] too long` })
      }
      return f
    })
  }

  const slideCount = Number(body.slideCount ?? 7)
  if (!Number.isInteger(slideCount) || slideCount < 1 || slideCount > 12) {
    throw createError({ statusCode: 400, statusMessage: 'slideCount must be 1–12' })
  }

  const mode = body.mode === 'full-design' ? 'full-design' : 'copy-only'

  const images = Array.isArray(body.images) ? body.images : []
  if (images.length > 12) {
    throw createError({ statusCode: 400, statusMessage: 'Too many images' })
  }
  for (const img of images) {
    if (typeof img !== 'string' || img.length > 1_500_000) {
      throw createError({ statusCode: 413, statusMessage: 'Image payload too large' })
    }
  }

  const systemPrompt = mode === 'full-design' ? DESIGN_SYSTEM_PROMPT : COPY_SYSTEM_PROMPT

  async function callWithImages(imgs: string[]): Promise<string> {
    const userPrompt = buildUserPrompt(appName, appDescription, features, slideCount, locale, imgs.length)
    const msgPayload = buildMessages(systemPrompt, userPrompt, imgs, provider)

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
          max_tokens: 2048,
          system: msgPayload.system,
          messages: msgPayload.messages,
        },
      })
      return res.content?.[0]?.text ?? ''
    }

    const model = openrouterModel || 'anthropic/claude-3-5-sonnet'
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
        messages: msgPayload.messages,
        max_tokens: 2048,
      },
    })
    return res.choices?.[0]?.message?.content ?? ''
  }

  try {
    let responseText: string

    if (images.length > 0) {
      try {
        // Try with images (vision)
        responseText = await callWithImages(images)
      } catch (visionErr: any) {
        // Model doesn't support vision — fallback to text-only
        console.warn('Vision not supported by model, falling back to text-only:', visionErr?.data?.error?.message || visionErr.message)
        responseText = await callWithImages([])
      }
    } else {
      responseText = await callWithImages([])
    }

    if (mode === 'full-design') {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw createError({ statusCode: 502, statusMessage: 'Could not parse AI response' })
      const parsed = JSON.parse(jsonMatch[0])
      return { slides: parsed.slides || [], colors: parsed.colors || null }
    }

    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw createError({ statusCode: 502, statusMessage: 'Could not parse AI response' })
    return { slides: JSON.parse(jsonMatch[0]) }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: String(err) })
  }
})
