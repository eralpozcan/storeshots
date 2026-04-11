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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const {
    provider, apiKey, openrouterModel,
    appName, appDescription, features,
    slideCount = 7, locale = 'en',
    mode = 'copy-only',
    images = [],
  } = body

  if (!apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'API key is required' })
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
          model: 'claude-sonnet-4-6',
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
