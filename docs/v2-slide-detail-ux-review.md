# V2 slide detail UX review

## Recommended detail screen

The slide detail should answer one question: **what is different about this slide?**

Keep only:

1. **Headline** — primary field, visible immediately.
2. **Supporting label** — optional, collapsed under “More text” by default.
3. **Screenshot** — thumbnail plus Replace and Remove actions.
4. **Layout** — 3–4 visual choices relevant to the selected template, rather than a ten-item text select.
5. **Adjust placement** — an explicit mode that enables drag and resize on the canvas.

Header: `All slides / Slide 03`, with previous and next controls. The existing filmstrip already provides enough navigation; do not add another slide selector.

## Remove from slide detail

- Templates, Background, Brand, AI and Languages. These affect the set and belong only in the all-slides view.
- Always-visible transform handles and delete buttons. Show them only after the user chooses Adjust placement.
- The global Download action as a slide-editing control. Export stays in the Download step.
- “Manage all” beside the screenshot. Replace or Remove is enough in context.
- Reset layout when nothing was customized. Show it only after a manual placement or per-slide layout change.

## Resulting interaction

```text
All slides  /  Slide 03                       Previous  Next

Headline
[ Her harcama kayıt altında                  ]

Screenshot
[ thumbnail ]  Replace  Remove

Layout
[ Standard ] [ Full screen ] [ Offset ]

[ Adjust placement ]
```

The canvas stays clean by default. Selecting `Adjust placement` reveals move/resize controls and a Done action. Returning to all slides restores the set overview and its global categories.

## Why this is the effective minimum

- Headline and screenshot are the two inputs users change most per slide.
- Layout choice remains powerful but becomes visual and bounded by the active template.
- Precise positioning remains available without making every user operate a mini design tool.
- Global decisions appear once, at set level, so the user does not wonder whether a background or language change affects one slide or all slides.

Status: analysis only; no UI code changed for this review.
