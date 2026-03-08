# AI Video Remix Engine

## Owner
Teammate 2

## Scope
Build a high-level video duplication engine that breaks down high-converting short-form video ads into core components and rebuilds variations:
- **Video Decomposition** – Scene detection, hook extraction, CTA identification
- **Component Analysis** – Identify music, voiceover, text overlays, transitions
- **Remix Generation** – Create variations using different hooks, CTAs, visual styles

## Implementation Notes
- Add new API routes under `src/app/api/video-remix/` as needed
- Use shared types from `@/shared/types` for ad data
- Build UI components in this directory (`components/`)
- Add new pages under `src/app/video-remix/` (create the directory)

## Directory Structure
```
features/video-remix/
├── components/   ← Video player, timeline editor, remix controls
├── lib/          ← Video decomposition, scene detection, remix logic
├── types/        ← Video-specific types (scenes, components, remix config)
└── README.md     ← This file
```

## Getting Started
```bash
git checkout feature/video-remix
npm run dev
```
