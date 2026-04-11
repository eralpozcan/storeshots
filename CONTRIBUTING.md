# Contributing to Storeshots

Thanks for your interest in contributing! Storeshots is in **beta** and we welcome contributions of all kinds.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/eralpozcan/storeshots.git
   cd storeshots
   ```
3. **Install** dependencies:
   ```bash
   pnpm install
   ```
4. **Start** the dev server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3005](http://localhost:3005)

## Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3005) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |

### Project Structure

```
storeshots/
├── app/
│   ├── pages/              # Page routes
│   ├── components/         # Vue components
│   │   └── slides/         # Slide templates & device frames
│   ├── composables/        # State management & logic
│   └── utils/              # Types, defaults, canvas math
├── server/api/             # API endpoints (AI generation)
└── public/                 # Static assets (mockup images)
```

## How to Contribute

### Bug Reports

- Open an [issue](https://github.com/eralpozcan/storeshots/issues) with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser and OS info
  - Screenshots if applicable

### Feature Requests

- Open an issue with the `enhancement` label
- Describe the use case, not just the solution
- Share mockups or references if you have them

### Pull Requests

1. Create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test locally with `pnpm dev`
4. Commit with a descriptive message:
   ```bash
   git commit -m "feat: add new slide template with split layout"
   ```
5. Push and open a PR against `main`

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation |
| `style:` | Formatting (no code change) |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvements |
| `chore:` | Build, deps, config |

## Areas We'd Love Help With

- **Slide Templates** — New layouts, compositions, and visual styles
- **Device Frames** — New device types or improved CSS frames
- **AI Prompts** — Better headline generation, smarter ordering
- **Export Quality** — Sharper renders, edge case fixes
- **Multi-Language** — New locale support, translation improvements
- **Accessibility** — Keyboard navigation, screen reader support
- **Documentation** — Guides, examples, video tutorials

## Code Style

- **TypeScript** for all `.ts` and `.vue` files
- **Composition API** with `<script setup>` for Vue components
- **Tailwind CSS** for styling (avoid inline styles when Tailwind classes exist)
- Keep components focused and under 200 lines when possible

## Questions?

Open a [discussion](https://github.com/eralpozcan/storeshots/discussions) or reach out via issues. We're happy to help you get started!

---

Thank you for helping make Storeshots better!
