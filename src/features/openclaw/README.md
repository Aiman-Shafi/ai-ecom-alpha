# OpenClaw – Competitor Intelligence Agent

## Owner
Teammate 1

## Scope
Integrate an OpenClaw agent running a web scraping skill to autonomously crawl:
- **Meta Ad Library** – Discover and track competitor ads on Facebook/Instagram
- **TikTok Top Ads** – Crawl TikTok's creative center for top-performing ads

## Implementation Notes
- Use Decodo integration or built-in browser automation for web scraping
- Store scraped ad data using types from `@/shared/types`
- Add new API routes under `src/app/api/openclaw/` as needed
- Build UI components in this directory (`components/`)
- Add new pages under `src/app/openclaw/` (create the directory)

## Directory Structure
```
features/openclaw/
├── components/   ← Scraping UI, crawl status, results display
├── lib/          ← Scraper logic, Decodo client, data parsers
├── types/        ← OpenClaw-specific types (crawl results, etc.)
└── README.md     ← This file
```

## Getting Started
```bash
git checkout feature/openclaw
npm run dev
```
