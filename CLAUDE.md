# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlideScript is a ChatGPT Apps SDK application that generates presentation scripts from PDF/PPTX files. It uses MCP (Model Context Protocol) for the server and React+TypeScript for the widget UI.

## Architecture

```
slidescript/
├── package.json          # Root workspace config
├── server/               # MCP server (Cloudflare Workers + Hono)
│   ├── src/
│   │   ├── index.ts      # Hono app, MCP endpoint handler
│   │   ├── types.ts      # Shared type definitions
│   │   ├── store.ts      # In-memory project/slide state
│   │   ├── template.ts   # Widget HTML template + inline CSS/JS
│   │   └── tools/
│   │       ├── ingest.ts   # PDF/PPTX file parsing
│   │       └── generate.ts # Script generation logic
│   └── wrangler.toml
└── web/                  # React widget UI
    ├── src/
    │   ├── main.tsx      # Entry point
    │   ├── App.tsx       # Main component
    │   ├── types.ts      # TypeScript types
    │   ├── styles.css    # Component styles
    │   ├── openai-hooks.ts # OpenAI bridge hooks
    │   └── components/   # UI components
    └── dist/             # Bundled output
```

**Key Pattern**: The widget JS/CSS is inlined into `server/src/template.ts` and served as `text/html+skybridge` resource. For development, the inline version is used; for production, build web/ and copy to template.

## Build Commands

```bash
# Install dependencies (from root)
bun install

# Development
bun run dev                 # Start Wrangler dev server on :8787

# Build web components
bun run build:web           # Bundle to dist/main.js

# Build all
bun run build               # Build web + server

# Deploy
cd server && bun run deploy # Deploy to Cloudflare Workers
```

## Tools (MCP)

| Tool | Purpose | Meta Flags |
|------|---------|------------|
| `ingest_deck` | Parse PDF/PPTX via file params | `fileParams: ["deck_file"]` |
| `generate_script` | Generate scripts + timing allocation | - |
| `update_slide` | Edit single slide (timing/script) | `widgetAccessible`, `visibility: "private"` |
| `rebalance_timing` | Redistribute time across unlocked slides | `widgetAccessible`, `visibility: "private"` |
| `export_script` | Export as Markdown | `widgetAccessible`, `visibility: "private"` |

## Data Types

**Project**: Contains settings (totalSeconds, audience, tone, language) and stats.

**Slide**: Contains raw text, timing (seconds, locked, min/max), script (goal, talkTrack, keyPoints, transitions), and flags (too_long, too_short, dense).

## Data Flow

1. User attaches PDF/PPTX in chat → `ingest_deck` receives via `_meta["openai/fileParams"]`
2. `generate_script` estimates timing from text length, creates placeholder scripts
3. Widget displays via `window.openai.toolOutput` (structuredContent)
4. Edits: widget → `update_slide` → server store → returns updated structuredContent
5. UI state (`selectedSlideId`) uses `window.openai.setWidgetState`

## Testing

```bash
# MCP Inspector (from server/)
bun run inspect

# Or directly
bunx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp

# Connect to ChatGPT
# Use ngrok to expose localhost, then add connector URL in ChatGPT Developer mode
```

## Key Constraints

- Widget `uploadFile` only supports images—PDF/PPTX must come through chat attachment
- `structuredContent` is visible to the model—keep data minimal
- Cloudflare Workers have limited Node.js APIs—PDF/PPTX parsing is basic text extraction
