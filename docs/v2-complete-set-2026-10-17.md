# V2 complete-set wizard

The wizard now follows Screenshots → Outputs → Your set. Users select device/store outputs, create a composed set, and download every listed size in one ZIP. Individual image editing and set-wide tools open only when requested. AI provider/model configuration remains in settings; generation is optional and is never triggered by downloading.

## Behavior

- Existing device-specific images are preserved; empty slots reuse the source screenshots.
- Header and Search require dedicated artwork. Duo exports artwork at the selected display dimensions without an invented hardware frame.
- Default compositions vary across the set. A tenth screenshot replaces the optional closing card.
- ZIP folders identify language, output, and dimensions. Missing artwork or language content stops the package before a partial download.
- Export uses a snapshot and a separate renderer, leaving the active preview and draft untouched.
- AI text follows the original screenshot slots and retains layout edits, including sparse uploads and the tenth image.
- Prepared output selections survive draft reload and project import. V1 remains available with separate draft storage.

## Verification

- Final production build completed successfully. Existing Tailwind sourcemap warnings remain; Nitro reported zero errors.
- Five Node test files pass, covering upload preservation, layout preparation, all-size export planning, AI text/image association, missing-content validation, capture options, AI preferences, and V1 Blob downloads.
- Browser generated and downloaded one ZIP with 13 image files across iPhone (all four existing sizes), Android phone, Duo outer, Header, and Search. PNG/JPEG header dimensions match every ZIP folder.
- Browser confirmed optional image editing and returning to the result overview.
- Reload restored the prepared output selection, edited headline, and result overview without opening the inspector.
- At 390 px viewport width, document content width is 390 px and the inspector is absent in the overview.
- No paid AI request was made. Provider behavior and App Store Connect acceptance were not tested.

The QA fixture contains placeholder images and is not example marketing artwork.
