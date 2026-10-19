# Quick Start Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended for this repo/session — user asked not to delegate exploration or edits to subagents) or superpowers:subagent-driven-development if a future session prefers per-task subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "fill 5 tabs before you're done" first impression with a focused, 3-step Quick Start Wizard that captures the true minimum (identity, a template, a few screenshots, optional AI key), then drops the user straight into the existing canvas + sidebar — which keeps 100% of its current capability as the "fine-tune later" surface.

**Architecture:** One new component, `QuickStartWizard.vue`, replaces the current template-only first-run `UModal` in `editor.vue`. It emits the same `change`/`generate-design` events `AppSidebar.vue` already emits, so `editor.vue` wires it with the exact same handlers (`updateConfig`, `generateFullDesign`) — no new state management, no new API calls, no new composable logic. The 5-tab sidebar is untouched except a relabel and a smarter default landing tab.

**Tech Stack:** Nuxt 4 / Vue 3 `<script setup>`, Nuxt UI v4 components (`UModal`, `UInput`, `UTextarea`, `USelect`, `UButton`), Tailwind utility classes — matches every existing component in `app/components/`.

## Global Constraints
- **No test framework in this repo** (`package.json` scripts: `dev` / `build` / `preview` only, no vitest/jest). Every "write failing test" step in the standard writing-plans template is replaced with a **manual browser verification** step — run `npm run dev`, exercise the flow, confirm the described behavior.
- **Nuxt auto-imports components** under `app/components/` — confirmed by `AppSidebar.vue` being used in `editor.vue` (line 857) with no explicit `import` statement. `QuickStartWizard.vue` needs no import line either.
- **Reuse, don't duplicate.** Every field in the wizard reuses markup/patterns that already exist in `AppSidebar.vue` or `editor.vue` — see per-task "Reuses" notes. The only genuinely new logic is the wizard's own step/local-state handling and the `finish()` assembly function.
- **Surgical changes only** (per project CLAUDE.md). The 5-tab sidebar's fields, validation, and behavior are not restructured — only its default landing tab and step labels change (Task 5). Nothing is deleted except code the wizard makes dead (the old `applyTemplate` function, Task 4).
- **Merge-patch convention.** State updates flow as `emit('change', patch: Partial<UserConfig>)` → parent calls `updateConfig(patch)` (already used everywhere, e.g. `AppSidebar.vue:107-109`, `editor.vue:121-131`). The wizard follows the same convention — never emits a full `UserConfig`, only the fields it touched.

## Design Language

Direction: **corporate, professional, simple.** This is a utility modal inside an existing product, not a marketing page — the win condition is looking like it was built by the same team that built the sidebar, not standing out from it. No new palette, no new typeface, no new icon set. Every visual decision below is "use what's already there, precisely," not "invent something."

- **Color:** only the tokens already in use across `AppSidebar.vue`/`editor.vue` — `blue-600`/`blue-50` as the single accent (selection states, primary actions, links), `gray-900` for headings, `gray-700` for labels, `gray-500` for body/help text, `gray-400` for placeholders/meta, `gray-200` for borders, white surfaces. No new hex values anywhere in this feature.
- **Type:** the existing scale exactly — `text-sm font-bold` for the modal title (matches `UModal` default), `text-xs font-semibold text-gray-700` for field labels, `text-xs`/`text-[11px]`/`text-[10px] text-gray-500`/`text-gray-400` for body/help copy, same as every field in `AppSidebar.vue`. No new sizes invented for the wizard.
- **Spacing:** `space-y-4` between fields within a step (matches `AppSidebar.vue` section rhythm), standard `UModal` body/footer padding — don't override it with custom padding.
- **Icons:** `i-lucide-*` via `UIcon` only, same as the rest of the app. Template-card emoji are existing data from `START_TEMPLATES` (category recognition, not new decoration) — left as-is.
- **Motion — the one deliberate touch:** a short, single cross-fade/slide between wizard steps (`<Transition name="step">`, ~150ms, translate-x 8px + opacity) so advancing feels intentional rather than an instant jump-cut. That's the entire motion budget for this feature — no per-field entrance animations, no hover flourishes beyond what `UButton`/existing `hover:` classes already provide. Respect `prefers-reduced-motion` (disable the transform, keep the opacity fade only) and keep every interactive element keyboard-reachable with a visible focus ring (Nuxt UI's defaults already provide this — don't override `focus:outline-none` anywhere).
- **Copy voice:** active voice, name the outcome not the mechanism ("Create my screenshots," not "Submit"), no exclamation marks, no hype adjectives ("powerful," "amazing"). A button's label and the state it produces stay the same word (this plan's "Create my screenshots" → lands the user in the editor with screenshots visible — no relabeling to "Done" or "Finish" partway through). If a step is skippable, say what's lost in one plain clause, not a sales pitch for staying.

## Task Handoff & Parallelization

Each task below is self-contained: exact file paths, exact code, an independent manual-verification step, and its own commit — any competent coding agent (this session, a future Claude Code session, or a different product's agent — Cursor, Codex, etc.) can pick one up with just this document, no conversation history required. That's deliberate, since some tasks may be handed to a different agent than the one that did the others.

Real dependencies (by shared file, not by narrative order):

- **Sequential, single track (one agent/session at a time):** Task 0 → Task 1 → Task 2 → Task 3 → Task 4. Tasks 1-3 all edit the same new `QuickStartWizard.vue` (each appends a step + updates the shared footer), and Task 4 needs the component's final props/emits to exist — handing these to different agents in parallel would just produce merge conflicts on the same file.
- **Can run in parallel, once Task 0 is committed:** Task 5 (`AppSidebar.vue` — different concern, same file Task 0 touched, but non-overlapping line ranges: `activeStep`/`STEPS` near the top vs. the `handleFileUpload`→`fileToDataUrl` swap lower down). Safe to assign to a second agent working from a branch/worktree while the first agent does Tasks 1-4.
- **Fully independent, any time:** Task 6 (`CHANGELOG.md`) — no code dependency at all, can be written the moment the feature's behavior is understood, by any agent, first or last.

If splitting across agents: give each agent only its task's block (Global Constraints + Design Language always apply and should be included in every handoff), plus a note of which prior tasks are already committed so it can `git pull`/rebase before starting.

---

### Task 0: Extract the shared file→dataURL helper

`AppSidebar.vue` has a local, non-exported `handleFileUpload(file: File): Promise<string>` (lines 225-232) that reads a `File` into a data-URL. The wizard needs the exact same thing for its icon and screenshot inputs. Duplicating it a third time violates DRY — extract it once, both components import it.

**Files:**
- Create: `app/utils/files.ts`
- Modify: `app/components/AppSidebar.vue:225-232` (delete local copy, import shared one)

- [ ] **Step 1: Create the shared helper**

```ts
// app/utils/files.ts
// Reads a File (from an <input type=file> or drag-drop event) into a base64
// data-URL, for inline storage in UserConfig (icon, screenshots, custom font).
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 2: Point AppSidebar.vue at the shared helper**

In `app/components/AppSidebar.vue`, delete the local `handleFileUpload` function (lines 225-232) and add to the top imports:

```ts
import { fileToDataUrl } from '~/utils/files'
```

Then replace the three call sites (`onIconDrop`, `onIconSelect`, `onScreenshotSelect` — they call `handleFileUpload(...)`) with `fileToDataUrl(...)`. `onBulkUpload` (line 265-274) also calls it — same replacement.

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open `/editor`, go to sidebar Step 1 (Basics), drop/select an app icon — confirm it still previews correctly. Go to Step 2 (Screenshots), upload one image into a slot — confirm it still previews. (Behavior must be pixel-identical to before; this task only moves code.)

- [ ] **Step 4: Commit**

```bash
git add app/utils/files.ts app/components/AppSidebar.vue
git commit -m "refactor: extract fileToDataUrl helper for reuse by QuickStartWizard"
```

---

### Task 1: QuickStartWizard shell + Step 1 (Identity)

**Files:**
- Create: `app/components/QuickStartWizard.vue`

**Interfaces:**
- Props: `{ open: boolean, config: UserConfig }`
- Emits: `{ 'update:open': [value: boolean], change: [patch: Partial<UserConfig>], 'generate-design': [] }`
- Produces (for later tasks in this file): a `step` ref (1-3), a `finish()` function assembled incrementally across Tasks 1-3, local draft refs `localIcon`, `localName`, `localDescription` (seeded from `props.config` when `open` flips true).

- [ ] **Step 1: Create the component shell + step 1 body**

```vue
<!-- app/components/QuickStartWizard.vue -->
<script setup lang="ts">
import type { UserConfig } from '~/utils/types'
import { fileToDataUrl } from '~/utils/files'

const props = defineProps<{
  open: boolean
  config: UserConfig
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  change: [patch: Partial<UserConfig>]
  'generate-design': []
}>()

const step = ref(1)
const localIcon = ref<string | null>(null)
const localName = ref('')
const localDescription = ref('')
const iconInputRef = ref<HTMLInputElement>()

// Reseed drafts every time the wizard opens fresh, and reset to step 1.
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  step.value = 1
  localIcon.value = props.config.appIcon
  localName.value = props.config.appName
  localDescription.value = props.config.appDescription
})

async function onIconSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  localIcon.value = await fileToDataUrl(file)
}
async function onIconDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (!file) return
  localIcon.value = await fileToDataUrl(file)
}

function close() {
  emit('update:open', false)
}
function startBlank() {
  close()
}
</script>

<template>
  <UModal
    :open="open"
    title="Quick start"
    description="Three quick steps — you can fine-tune everything after."
    @update:open="(v: boolean) => !v && close()"
  >
    <template #body>
      <!-- Step dots -->
      <div class="flex items-center gap-1.5 mb-4">
        <div
          v-for="n in 3"
          :key="n"
          class="h-1.5 flex-1 rounded-full transition-colors"
          :class="n <= step ? 'bg-blue-500' : 'bg-gray-200'"
        />
      </div>

      <!-- Step content — single deliberate cross-fade/slide on step change.
           `mode="out-in"` avoids both steps occupying space mid-transition. -->
      <Transition name="step" mode="out-in">
        <div v-if="step === 1" key="1" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">App icon <span class="font-normal text-gray-400">· optional</span></label>
            <div
              class="relative w-full h-24 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-gray-50"
              :class="localIcon ? 'border-transparent bg-white' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40'"
              @click="iconInputRef?.click()"
              @dragover.prevent
              @drop="onIconDrop"
            >
              <img v-if="localIcon" :src="localIcon" alt="App icon" class="w-16 h-16 rounded-xl object-cover shadow-sm">
              <template v-else>
                <UIcon name="i-lucide-image-plus" class="size-6 text-gray-400 mb-1" />
                <span class="text-[11px] text-gray-500">Click or drop</span>
              </template>
              <input ref="iconInputRef" type="file" accept="image/*" class="hidden" @change="onIconSelect">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">App name</label>
            <UInput v-model="localName" size="sm" placeholder="My App" class="w-full" autofocus />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <UTextarea v-model="localDescription" :rows="3" size="sm" placeholder="One sentence about what your app does." maxlength="600" class="w-full" :ui="{ base: 'w-full' }" />
          </div>
        </div>
      </Transition>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UButton color="neutral" variant="ghost" @click="startBlank">Start blank</UButton>
        <UButton :disabled="!localName" @click="step = 2">Continue</UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* The one deliberate motion moment in this feature (see Design Language).
   Reduced-motion users still get the fade, just no slide. */
.step-enter-active,
.step-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
@media (prefers-reduced-motion: reduce) {
  .step-enter-active,
  .step-leave-active {
    transition: opacity 150ms ease;
  }
  .step-enter-from,
  .step-leave-to {
    transform: none;
  }
}
</style>
```

- [ ] **Step 2: Manual verification**

`npm run dev`, temporarily render `<QuickStartWizard :open="true" :config="config" />` anywhere reachable (or jump ahead and wire it in Task 4 first, then come back) — confirm: step dots show, icon dropzone click opens file picker and previews a dropped/selected image, app name is required to enable Continue, description textarea works. "Start blank" closes without emitting `change`.

- [ ] **Step 3: Commit**

```bash
git add app/components/QuickStartWizard.vue
git commit -m "feat(wizard): QuickStartWizard shell + identity step"
```

---

### Task 2: Step 2 (Template & Screenshots)

**Reuses:** template cards markup from `editor.vue:1656-1681` (`START_TEMPLATES`), screenshot-slot markup from `AppSidebar.vue:682-730` (simplified to one device).

**Interfaces:**
- Adds local refs: `localTemplateKey: Ref<string | null>`, `localScreenshots: Ref<(string | null)[]>` (length 10, matches `SLIDE_COUNT`).

- [ ] **Step 1: Add step 2 state + body**

Add to `<script setup>` (after the Task 1 refs):

```ts
import { START_TEMPLATES } from '~/utils/templates'
import { SLIDE_COUNT } from '~/utils/defaults'

const localTemplateKey = ref<string | null>(null)
const localScreenshots = ref<(string | null)[]>(Array(SLIDE_COUNT).fill(null))
const ssInputRef = ref<HTMLInputElement>()

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  localTemplateKey.value = null
  localScreenshots.value = Array(SLIDE_COUNT).fill(null)
})

async function onScreenshotsSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  const next = [...localScreenshots.value]
  for (let i = 0; i < Math.min(files.length, SLIDE_COUNT); i++) {
    next[i] = await fileToDataUrl(files[i]!)
  }
  localScreenshots.value = next
  ;(e.target as HTMLInputElement).value = ''
}
function removeScreenshot(idx: number) {
  const next = [...localScreenshots.value]
  next[idx] = null
  localScreenshots.value = next
}
```

In the `<template>`, add this **inside the same `<Transition name="step" mode="out-in">` from Task 1**, as a `v-else-if` sibling of the step-1 `<div>` (both must live inside one `Transition` — it animates between whichever single child is currently rendered, so the step divs are `v-if`/`v-else-if`/`v-else` on one `Transition`, not separate `Transition` blocks):

```vue
<!-- Step 2: Template & Screenshots -->
<div v-else-if="step === 2" key="2" class="space-y-4">
  <div>
    <label class="block text-xs font-semibold text-gray-700 mb-2">Pick a starting style <span class="font-normal text-gray-400">· optional</span></label>
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="t in START_TEMPLATES"
        :key="t.key"
        type="button"
        class="text-left rounded-lg border p-3 cursor-pointer transition-colors"
        :class="localTemplateKey === t.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
        @click="localTemplateKey = t.key"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <span class="text-base leading-none">{{ t.emoji }}</span>
          <span class="text-xs font-bold text-gray-900">{{ t.label }}</span>
        </div>
        <div class="flex gap-1">
          <span v-for="key in ['primary', 'accent', 'bgFrom', 'bgTo'] as const" :key="key" class="size-3 rounded-full border border-white shadow-sm" :style="{ backgroundColor: t.colors[key] }" />
        </div>
      </button>
    </div>
  </div>

  <div>
    <div class="flex items-center justify-between mb-1">
      <label class="text-xs font-semibold text-gray-700">Screenshots <span class="font-normal text-gray-400">· optional, iPhone shown here — add other devices later</span></label>
      <button type="button" class="text-[11px] font-semibold text-blue-600" @click="ssInputRef?.click()">Upload</button>
    </div>
    <input ref="ssInputRef" type="file" accept="image/*" multiple class="hidden" @change="onScreenshotsSelect">
    <div class="grid grid-cols-5 gap-1.5">
      <div v-for="(img, i) in localScreenshots" :key="i" class="w-full aspect-[9/19.5] rounded border-2 flex items-center justify-center relative overflow-hidden" :class="img ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'">
        <img v-if="img" :src="img" class="w-full h-full object-cover" alt="">
        <button v-if="img" class="absolute top-0.5 right-0.5 bg-black/60 text-white rounded w-4 h-4 text-[9px]" @click="removeScreenshot(i)">✕</button>
      </div>
    </div>
  </div>
</div>
```

Update the footer's Continue/Back to be step-aware (replace Task 1's footer):

```vue
<template #footer>
  <div class="flex justify-between w-full">
    <UButton v-if="step > 1" color="neutral" variant="ghost" @click="step -= 1">Back</UButton>
    <UButton v-else color="neutral" variant="ghost" @click="startBlank">Start blank</UButton>
    <UButton v-if="step < 3" :disabled="step === 1 && !localName" @click="step += 1">Continue</UButton>
  </div>
</template>
```

- [ ] **Step 2: Manual verification**

Advance to step 2, click a template card — selection border toggles (single-select). Upload 3 images via the Upload button — thumbnails fill left-to-right, remove middle one — confirm it clears just that slot.

- [ ] **Step 3: Commit**

```bash
git add app/components/QuickStartWizard.vue
git commit -m "feat(wizard): template + screenshot step"
```

---

### Task 3: Step 3 (optional AI key) + finish handler

**Reuses:** provider/key inputs from `AppSidebar.vue:908-996`.

- [ ] **Step 1: Add step 3 state + body + finish()**

```ts
const localProvider = ref<'claude' | 'openrouter'>('claude')
const localApiKey = ref('')

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  localProvider.value = props.config.ai.provider
  localApiKey.value = props.config.ai.apiKey
})

function finish() {
  const patch: Partial<UserConfig> = {
    appName: localName.value,
    appDescription: localDescription.value,
    appIcon: localIcon.value,
    images: { ...props.config.images, iphone: localScreenshots.value },
  }
  const t = START_TEMPLATES.find(tpl => tpl.key === localTemplateKey.value)
  if (t) {
    patch.colors = t.colors
    patch.copy = t.copy
    patch.features = t.features
    patch.aiBrief = t.aiBrief
  }
  if (localApiKey.value) {
    patch.ai = { ...props.config.ai, provider: localProvider.value, apiKey: localApiKey.value }
  }
  emit('change', patch)
  emit('update:open', false)
  if (localApiKey.value) {
    // Wait a tick so the parent's config ref has the patch above applied
    // before generateFullDesign() reads config.value.ai.apiKey.
    nextTick(() => emit('generate-design'))
  }
}
```

Add this **inside the same `<Transition>` from Task 1**, as the final `v-else` sibling (after step 1's `v-if` and step 2's `v-else-if`):

```vue
<!-- Step 3: optional AI key -->
<div v-else key="3" class="space-y-4">
  <p class="text-xs text-gray-500 leading-relaxed">
    Add a key to auto-generate headlines and colors from your screenshots. Skip it and you'll get the template's copy as-is — editable anytime.
  </p>
  <div>
    <label class="block text-xs font-semibold text-gray-700 mb-1">Provider</label>
    <USelect
      v-model="localProvider"
      :items="[{ label: 'Claude (Anthropic)', value: 'claude' }, { label: 'OpenRouter', value: 'openrouter' }]"
      value-key="value"
      label-key="label"
      size="sm"
      class="w-full"
    />
  </div>
  <div>
    <label class="block text-xs font-semibold text-gray-700 mb-1">API key <span class="font-normal text-gray-400">· optional</span></label>
    <UInput v-model="localApiKey" type="password" size="sm" :placeholder="localProvider === 'claude' ? 'sk-ant-...' : 'sk-or-...'" class="w-full" />
  </div>
</div>
```

Replace the footer's Continue button (step < 3) with a Finish button at step 3:

```vue
<template #footer>
  <div class="flex justify-between w-full">
    <UButton v-if="step > 1" color="neutral" variant="ghost" @click="step -= 1">Back</UButton>
    <UButton v-else color="neutral" variant="ghost" @click="startBlank">Start blank</UButton>
    <UButton v-if="step < 3" :disabled="step === 1 && !localName" @click="step += 1">Continue</UButton>
    <UButton v-else @click="finish">Create my screenshots</UButton>
  </div>
</template>
```

- [ ] **Step 2: Manual verification**

Reach step 3, leave the key blank, click "Create my screenshots" — modal closes, canvas/sidebar reflect the chosen template's colors/copy and the uploaded iPhone screenshots, name/description/icon applied. Repeat with a (fake) key entered — same result, plus a loading state then an error toast (invalid key) confirming `generate-design` fired.

- [ ] **Step 3: Commit**

```bash
git add app/components/QuickStartWizard.vue
git commit -m "feat(wizard): AI key step + finish handler"
```

---

### Task 4: Wire into editor.vue, remove now-dead code

**Files:**
- Modify: `app/pages/editor.vue:121-131` (delete `applyTemplate`, now unused)
- Modify: `app/pages/editor.vue:1649-1694` (replace the template-only `UModal` with `<QuickStartWizard>`)

- [ ] **Step 1: Delete the now-unused `applyTemplate`**

Remove `app/pages/editor.vue:121-131` (the whole `function applyTemplate(t: StartTemplate) { ... }` block) — its job moved into `QuickStartWizard`'s `finish()`. If `StartTemplate` type import (`import { START_TEMPLATES, type StartTemplate } from '~/utils/templates'` at line 12) becomes unused as a type after this deletion, narrow it to `import { START_TEMPLATES } from '~/utils/templates'` — check first, `START_TEMPLATES` itself is still used by the old modal's `v-for` (which is also being deleted in Step 2 below, so after this task neither may be referenced in `editor.vue` at all — if so, delete the import line entirely).

- [ ] **Step 2: Replace the modal**

Replace `app/pages/editor.vue:1649-1694` (the `<!-- Quick-start template picker -->` `UModal` block) with:

```vue
<!-- Quick-start wizard -->
<QuickStartWizard
  :open="templatePickerOpen"
  :config="config"
  @update:open="(v: boolean) => { templatePickerOpen = v; if (!v) templatesDismissed = true }"
  @change="updateConfig"
  @generate-design="generateFullDesign"
/>
```

`templatePickerOpen`, `templatesDismissed`, `isFreshEditor`, and the `onMounted` first-run gating (editor.vue:789-805) all stay exactly as they are — they already do the right thing (open once, on a fresh project, unless dismissed).

- [ ] **Step 3: Manual verification**

Clear `localStorage` (or open in a private window), visit `/editor` — confirm the Quick Start Wizard opens (not the old template-only modal) ~350ms after load, and completing it (with or without a key) lands you in the canvas with the sidebar available, colors/copy/screenshots applied as chosen. Reload the page — wizard does NOT reopen (respects `templatesDismissed`).

- [ ] **Step 4: Commit**

```bash
git add app/pages/editor.vue
git commit -m "feat(wizard): wire QuickStartWizard into editor as the first-run flow"
```

---

### Task 5: Sidebar — relabel as fine-tune, land on the right tab

**Files:**
- Modify: `app/components/AppSidebar.vue:36-44` (`activeStep` default + step labels)

The wizard now covers "get something on screen." The sidebar's job after that is fine-tuning — but it currently always opens on step 1 (Basics) regardless of how much content already exists (`const activeStep = ref(1)`, line 37 — the adjacent comment already claims a smarter default was intended: *"Default to step 1 if no images, otherwise jump to Headlines"* — this was never actually implemented). Fix that so a post-wizard project opens on Style, not back on Basics.

- [ ] **Step 1: Smarter `activeStep` default**

Replace `app/components/AppSidebar.vue:36-37`:

```ts
// Wizard step. Default to step 1 if no images, otherwise jump to Headlines.
const activeStep = ref(1)
```

with:

```ts
// Land on Style (fine-tune) when the Quick Start Wizard already populated
// real copy — no reason to send a returning/wizard-completed user back to
// Basics. Truly blank projects still start at Basics.
const hasRealContent = props.config.copy.some(c => c.headline && c.headline !== 'Your headline\nhere.')
const activeStep = ref(hasRealContent ? 5 : 1)
```

- [ ] **Step 2: Relabel steps to read as fine-tuning**

Replace `app/components/AppSidebar.vue:38-44`:

```ts
const STEPS = [
  { id: 1, label: 'Basics', icon: 'i-lucide-info' },
  { id: 2, label: 'Screenshots', icon: 'i-lucide-image' },
  { id: 3, label: 'AI', icon: 'i-lucide-sparkles' },
  { id: 4, label: 'Headlines', icon: 'i-lucide-type' },
  { id: 5, label: 'Style', icon: 'i-lucide-palette' },
] as const
```

with (labels only — `id`/`icon` unchanged, so nothing else in the file needs touching):

```ts
const STEPS = [
  { id: 1, label: 'Basics', icon: 'i-lucide-info' },
  { id: 2, label: 'More shots', icon: 'i-lucide-image' },
  { id: 3, label: 'AI', icon: 'i-lucide-sparkles' },
  { id: 4, label: 'Copy', icon: 'i-lucide-type' },
  { id: 5, label: 'Style', icon: 'i-lucide-palette' },
] as const
```

- [ ] **Step 3: Manual verification**

Complete the wizard with a template selected → sidebar opens on Style (colors already visible/correct), not Basics. Start a project via "Start blank" (skip the wizard entirely) → sidebar opens on Basics as before.

- [ ] **Step 4: Commit**

```bash
git add app/components/AppSidebar.vue
git commit -m "fix(sidebar): land on Style after wizard, relabel steps as fine-tune"
```

---

### Task 6: Changelog entry

**Files:**
- Modify: `CHANGELOG.md` — add under `## [Unreleased] > ### Added`

- [ ] **Step 1: Add the entry**

```markdown
- **Quick Start Wizard**. First-run now opens a focused 3-step wizard
  (identity → template & screenshots → optional AI key) instead of the old
  template-only picker. Finishing applies your choices and, if a key was
  given, auto-generates headlines/colors from your screenshots — landing
  you straight in the editor with the sidebar open on Style for fine-tuning.
  The 5-tab sidebar is unchanged in capability; it's reachable anytime and
  no longer the mandatory first stop.
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for Quick Start Wizard"
```

---

## Self-Review Notes
- **Spec coverage:** identity capture (Task 1), template+screenshots (Task 2), optional AI (Task 3), wiring/dead-code removal (Task 4), sidebar landing/labels (Task 5), changelog (Task 6) — all covered.
- **Reuse:** confirmed no new AI/export logic — `generate-design` emit reuses `editor.vue`'s existing `@generate-design="generateFullDesign"` handler already proven by `AppSidebar.vue`.
- **Type consistency:** `finish()`'s patch shape matches `UserConfig` (`app/utils/types.ts:126-164`) exactly — `images` patch only overwrites `iphone`, spreading the rest of `props.config.images` so other devices already uploaded (e.g. from a previous session) aren't wiped.
- **Open question for whoever implements this:** Task 2's screenshot grid is iPhone-only by design (matches "true minimum" framing) — if that reads as *too* limited during manual testing, the fix is adding a tiny device toggle to step 2, not rethinking the architecture.
