import type { UserConfig, SlideElement, SlideCopy } from '~/utils/types'
import { VARIANT_PRESETS } from '~/utils/canvas'

// Read/write helper for the per-slide elements[] override.
//
// Storeshots stores layout as a discriminated union (VARIANT_PRESETS). When a
// user starts dragging/resizing, we clone the variant preset into
// SlideCopy.elements so future edits don't bleed across slides that share a
// variant. Once the override matches the preset again, we drop it so the
// slide reverts to being "default" — keeps localStorage clean and lets
// preset evolution propagate to untouched slides.

export function useElementOverride(
  config: Ref<UserConfig>,
  updateConfig: (patch: Partial<UserConfig>) => void,
) {
  function resolveElements(slideIdx: number, variant: number): SlideElement[] {
    const copy = config.value.copy[slideIdx]
    return copy?.elements ?? VARIANT_PRESETS[variant] ?? VARIANT_PRESETS[1] ?? []
  }

  // Apply a patch to a single element, persisting via updateConfig. The patch
  // type matches the element's discriminator — caller doesn't need to know if
  // it's a device/caption/etc, but patch fields are merged shallowly.
  function patchElement(
    slideIdx: number,
    variant: number,
    elementId: string,
    patch: Partial<SlideElement>,
  ) {
    const current = resolveElements(slideIdx, variant)
    const next = current.map((el) => {
      if (el.id !== elementId) return el
      // Cast through unknown: we can't preserve discriminant narrowing through
      // the spread, but at runtime fields stay type-consistent because the
      // caller targets a specific element type.
      return { ...el, ...patch } as unknown as SlideElement
    })
    writeElements(slideIdx, variant, next)
  }

  // Replace the whole element list for a slide. Used by reset (next = preset).
  function writeElements(
    slideIdx: number,
    variant: number,
    next: SlideElement[],
  ) {
    const nextCopy = [...config.value.copy]
    const current = nextCopy[slideIdx] || { label: '', headline: '' }
    const preset = VARIANT_PRESETS[variant] ?? VARIANT_PRESETS[1] ?? []
    if (elementsEqual(next, preset)) {
      // Override now matches the preset → drop the field so the slide goes
      // back to inheriting from VARIANT_PRESETS.
      const { elements, ...rest } = current
      nextCopy[slideIdx] = rest as SlideCopy
    }
    else {
      // First-time override path: drop the legacy `position` field so its
      // translate doesn't stack on top of the caption element's own x/y.
      // Older configs that haven't entered focused mode yet keep `position`
      // and continue rendering via the backwards-compat captionTranslate.
      const { position, ...rest } = current
      nextCopy[slideIdx] = { ...rest, elements: next }
    }
    updateConfig({ copy: nextCopy })
  }

  // Drop the override entirely — slide reverts to preset.
  function resetSlide(slideIdx: number) {
    const nextCopy = [...config.value.copy]
    const current = nextCopy[slideIdx]
    if (!current?.elements && !current?.variant && !current?.position) return
    const { elements, variant, position, ...rest } = current as SlideCopy
    nextCopy[slideIdx] = rest as SlideCopy
    updateConfig({ copy: nextCopy })
  }

  // Switch this slide to a different variant. Layout overrides belong to the
  // old variant, so we drop elements + position when the variant changes.
  function setVariant(slideIdx: number, variant: number, positionalDefault: number) {
    const nextCopy = [...config.value.copy]
    const current = nextCopy[slideIdx] || { label: '', headline: '' }
    // If picking the positional default again, drop the override field so the
    // slide goes back to inheriting from slideVariants.
    if (variant === positionalDefault) {
      const { variant: _v, elements, position, ...rest } = current as SlideCopy
      nextCopy[slideIdx] = rest as SlideCopy
    }
    else {
      const { elements, position, ...rest } = current as SlideCopy
      nextCopy[slideIdx] = { ...rest, variant } as SlideCopy
    }
    updateConfig({ copy: nextCopy })
  }

  function isOverridden(slideIdx: number): boolean {
    const c = config.value.copy[slideIdx]
    return !!(c?.elements || c?.variant)
  }

  // Append a new element to the slide. Always writes through writeElements
  // so the preset-equality drop kicks in (new element guarantees no preset
  // match, so an override is created).
  function addElement(slideIdx: number, variant: number, el: SlideElement) {
    const current = resolveElements(slideIdx, variant)
    writeElements(slideIdx, variant, [...current, el])
  }

  // Remove an element by id. If removing collapses the override back to the
  // preset (e.g. user added then removed in the same session), writeElements
  // handles the drop.
  function removeElement(slideIdx: number, variant: number, elementId: string) {
    const current = resolveElements(slideIdx, variant)
    const next = current.filter(el => el.id !== elementId)
    if (next.length === current.length) return // nothing removed
    writeElements(slideIdx, variant, next)
  }

  return {
    resolveElements, patchElement, writeElements,
    addElement, removeElement,
    resetSlide, setVariant, isOverridden,
  }
}

// Structural equality — used to drop overrides that have been edited back to
// the preset state. Cheap JSON compare suffices because element shapes are
// flat data with stable key ordering at the call site.
function elementsEqual(a: SlideElement[], b: SlideElement[]): boolean {
  if (a.length !== b.length) return false
  return JSON.stringify(a) === JSON.stringify(b)
}
