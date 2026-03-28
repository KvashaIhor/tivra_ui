# Tivra UI

Next.js frontend for Tivra.

It provides the prompt input, optional credential inputs, real-time pipeline activity feed, progress UI, and deployed app link.

## Responsibilities

- Capture product prompt
- Optionally collect Anthropic + InsForge credentials per build
- Call orchestrator build API
- Subscribe to build SSE stream
- Render pipeline progress and deployment result

## Scripts

From this folder:

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm lint
```

From repository root:

```bash
pnpm --filter demo-ui dev
pnpm --filter demo-ui build
pnpm --filter demo-ui start
pnpm --filter demo-ui test
```

## Environment Variables

Create `apps/demo-ui/.env.local` (optional):

```env
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:3001
```

If omitted, UI defaults to `http://localhost:3001`.

## Deploy To Vercel

This app is ready for Vercel as a standard Next.js project.

1. Import the repository (or this folder) into Vercel.
2. Set **Root Directory** to `apps/demo-ui` if deploying from monorepo root.
3. Configure environment variable:

```env
NEXT_PUBLIC_ORCHESTRATOR_URL=https://<your-orchestrator-domain>
```

4. Use Node.js 20 or 22 (the project expects Node `>=20 <23`).
5. Build command: `npm run build`
6. Output: Next.js default (`.next`) handled automatically by Vercel.

After deploy, verify the UI can reach your orchestrator URL from the browser.

## Build Workflow (UI)

1. User enters prompt.
2. User may expand "Provider Credentials" and supply any/all credentials.
3. UI sends `POST /api/build` to orchestrator.
4. UI subscribes to `GET /api/build/:buildId/stream`.
5. UI updates progress/activity as events arrive.
6. On `app_deployed`, UI shows live URL card and deployment link.

## Build Request Payload

Payload sent by UI:

```json
{
  "prompt": "Build an invoicing app",
  "credentials": {
    "anthropicApiKey": "...",
    "insforgeBaseUrl": "https://<project>.<region>.insforge.app",
    "insforgeAnonKey": "...",
    "insforgeAccessToken": "...",
    "insforgeProjectId": "..."
  }
}
```

Behavior:
- Empty credential fields are omitted.
- Prompt is always included.
- Credentials are intended for request-scoped backend use.

## Local Development

1. Start orchestrator first (port 3001).
2. Start demo-ui:

```bash
pnpm --filter demo-ui dev
```

3. Open `http://localhost:3000`.

## Key Files

- `src/app/page.tsx`: main interaction flow + SSE client
- `src/lib/types.ts`: UI event/build/payload types
- `src/components/ProgressBar.tsx`: pipeline progress
- `src/components/ActivityFeed.tsx`: live event log
- `src/components/InsforgeStatusPanel.tsx`: backend status indicators
- `src/components/LiveCard.tsx`: deployed app preview card
