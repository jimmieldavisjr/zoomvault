# ZoomVault — Operations Runbook (Outside-Cursor Steps)

This file lists everything that must be done **outside the Cursor coding
workflow** to get the MVP running. The application code is complete; these are
the manual operations (provisioning, dashboards, secrets, DNS, deploys, tests).

Anything marked **[MANUAL]** is a human action in an external tool. Anything
marked **[TERMINAL]** is a command you run yourself (it touches a real database,
secrets, or deploy target, so it is intentionally not run from inside Cursor).

---

## 0. Repository layout

```text
zoomvault/
  apps/
    api/   NestJS backend (Railway)   -> POST /zoom/webhook, /admin/*, /public/*, /health
    web/   Next.js frontend (Vercel)  -> /, /watch/[token], /admin, /expired, /access-denied
  docs/    specs + this runbook
```

Each app has its own `package.json`, `pnpm-lock.yaml`, and `.env.example`. Each
app is a standalone pnpm project (installed/deployed independently).

### Prerequisites

- **Node.js 22.13+** (pnpm 11 requires it).
- **pnpm 11** via Corepack (pinned in each `package.json` `packageManager` field):
  ```bash
  corepack enable
  corepack prepare pnpm@latest --activate   # or the version in packageManager
  ```

---

## 1. Local development

### Backend (`apps/api`)
1. **[TERMINAL]** Copy env: `cp .env.example .env` and fill in values.
   - For local DB, the easiest path is Docker:
     `docker run --name zoomvault-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=zoomvault -p 5432:5432 -d postgres:16`
     then `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zoomvault?schema=public"`.
2. **[TERMINAL]** Install deps: `pnpm install`.
3. **[TERMINAL]** Apply schema to the DB: `pnpm exec prisma migrate dev --name init`.
   (This is the step that actually creates the tables — it needs a live DB so it
   cannot run inside the Cursor sandbox.)
4. **[TERMINAL]** Start: `pnpm run start:dev` → API on `http://localhost:4000`.

### Frontend (`apps/web`)
1. **[TERMINAL]** `cp .env.example .env.local` and set
   `NEXT_PUBLIC_API_URL=http://localhost:4000`.
2. **[TERMINAL]** `pnpm install` then `pnpm dev` → web on `http://localhost:3000`.

---

## 2. Database (PostgreSQL on Railway)

1. **[MANUAL]** In Railway, add a **PostgreSQL** plugin to the project.
2. **[MANUAL]** Copy the connection string into the API service as `DATABASE_URL`
   (reference `${{ Postgres.DATABASE_URL }}` so it stays in sync).
3. **[TERMINAL]** Run migrations against production once per schema change:
   ```bash
   # from apps/api, with DATABASE_URL pointing at the Railway DB
   pnpm exec prisma migrate deploy
   ```
   - `migrate deploy` applies committed migrations (use in prod/CI).
   - `migrate dev` is for local development only (it can reset data).
4. Whenever you edit `prisma/schema.prisma`:
   **[TERMINAL]** `pnpm exec prisma generate` (regenerate client) then create a
   migration with `pnpm exec prisma migrate dev --name <change>` and commit the
   generated files in `prisma/migrations/`.

> NOTE: `pnpm exec prisma generate` was already run once in this workspace so the typed
> client compiles. It does **not** touch any database. Migrations do, so they are
> left as a [TERMINAL] step for you.

---

## 3. Backend deploy (Railway)

1. **[MANUAL]** Create a Railway service pointing at this repo, root `apps/api`.
2. **[MANUAL]** Build/start commands:
   - Build: `corepack enable && pnpm install --frozen-lockfile && pnpm run build && pnpm exec prisma generate`
   - Start: `pnpm exec prisma migrate deploy && pnpm run start:prod`
   (Running `migrate deploy` on start keeps prod schema current. Railway injects
   `PORT`; `main.ts` already reads it.)
3. **[MANUAL]** Set service **Variables** (see `apps/api/.env.example`):
   ```env
   DATABASE_URL=               # from the Postgres plugin
   ZOOM_WEBHOOK_SECRET_TOKEN=  # already configured per the build spec
   ZOOM_CLIENT_ID=             # optional (future use)
   ZOOM_CLIENT_SECRET=         # optional (future use)
   RESEND_API_KEY=
   EMAIL_FROM=ZoomVault <notifications@zoomvault.jdtechnologypartners.com>
   ADMIN_NOTIFICATION_EMAIL=
   APP_PUBLIC_URL=https://zoomvault.jdtechnologypartners.com
   API_PUBLIC_URL=https://api.zoomvault.jdtechnologypartners.com
   ADMIN_ACCESS_CODE=          # pick a strong shared code
   DEFAULT_LINK_EXPIRATION_DAYS=14
   CORS_ORIGINS=https://zoomvault.jdtechnologypartners.com
   ```
4. **[MANUAL]** Confirm the public URL responds: `GET /health` → `{"status":"ok"}`.

> SECURITY: never paste these secrets into chat, commits, screenshots, or logs.

---

## 4. Frontend deploy (Vercel)

1. **[MANUAL]** Import the repo into Vercel, root directory `apps/web`.
2. **[MANUAL]** Set env var `NEXT_PUBLIC_API_URL=https://api.zoomvault.jdtechnologypartners.com`.
3. **[MANUAL]** Deploy. Vercel auto-detects Next.js (build `next build`) and uses
   pnpm automatically from the committed `pnpm-lock.yaml`. Ensure the project's
   Node.js version is set to **22.x** (Project Settings → Node.js Version).

---

## 5. DNS (Namecheap)

1. **[MANUAL]** `zoomvault.jdtechnologypartners.com` → CNAME to Vercel
   (`cname.vercel-dns.com`), or follow Vercel's domain instructions.
2. **[MANUAL]** `api.zoomvault.jdtechnologypartners.com` → CNAME to the Railway
   service domain.
3. **[MANUAL]** Add both custom domains in the Vercel/Railway dashboards so TLS
   certs are issued.

> NOTE: the build spec references `api.zoomvault.jdtechpartners.com` for the
> existing webhook, while the overview uses `jdtechnologypartners.com`. Pick ONE
> canonical domain and make the Zoom dashboard, `APP_PUBLIC_URL`,
> `API_PUBLIC_URL`, `CORS_ORIGINS`, and DNS all agree.

---

## 6. Zoom dashboard (Marketplace App)

1. **[MANUAL]** App → **Feature → Event Subscriptions**:
   - Webhook URL: `https://<your-api-domain>/zoom/webhook` (keep `/zoom/webhook`,
     not `/zoom/webhooks`).
   - Click **Validate** — the API answers the CRC handshake automatically.
   - Subscribe to the **`recording.completed`** event.
   - Copy the **Secret Token** into `ZOOM_WEBHOOK_SECRET_TOKEN` (Railway).
2. **[MANUAL]** Zoom **Settings → Recording**: disable attendee **downloads** for
   cloud recordings (per product decision — downloads stay admin-only).
3. **[MANUAL]** (Optional) enable auto-transcription so transcripts are available
   later; the viewer already has a placeholder section.

---

## 7. Resend (email)

1. **[MANUAL]** Add and **verify your sending domain** in Resend (DKIM/SPF DNS
   records in Namecheap).
2. **[MANUAL]** Create an API key → set `RESEND_API_KEY` (Railway).
3. **[MANUAL]** Set `EMAIL_FROM` to an address on the verified domain and
   `ADMIN_NOTIFICATION_EMAIL` to where notifications should land.

> Until a domain is verified you can test with Resend's `onboarding@resend.dev`
> sender to a verified test inbox. If `RESEND_API_KEY` / `ADMIN_NOTIFICATION_EMAIL`
> are unset, the API just logs and skips sending — it never blocks the webhook.

---

## 8. Testing workflow

### Test 1 — CRC validation **[MANUAL]**
In the Zoom dashboard click **Validate** on the webhook URL. Expect success
(the endpoint echoes `plainToken` + `encryptedToken`).

### Test 2 — Mock `recording.completed` **[TERMINAL]**
Send a signed mock event to the running API. Zoom signs as
`v0=HMAC_SHA256("v0:{timestamp}:{rawBody}", secretToken)`.

PowerShell helper (run locally; replace the secret + body):
```powershell
$secret = $env:ZOOM_WEBHOOK_SECRET_TOKEN
$ts = [string][int][double]::Parse((Get-Date -UFormat %s))
$body = '{"event":"recording.completed","event_ts":1700000000000,"payload":{"account_id":"acc1","object":{"id":123456789,"uuid":"abcUUID==","host_id":"host1","topic":"Test Meeting","start_time":"2026-01-01T10:00:00Z","duration":30,"recording_count":1,"recording_files":[{"id":"file-1","file_type":"MP4","file_extension":"MP4","file_size":1048576,"play_url":"https://zoom.us/rec/play/abc","download_url":"https://zoom.us/rec/download/abc","status":"completed","recording_type":"shared_screen_with_speaker_view","recording_start":"2026-01-01T10:00:00Z","recording_end":"2026-01-01T10:30:00Z"}]}}}'
$msg = "v0:$ts" + ":" + $body
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
$sig = "v0=" + ([BitConverter]::ToString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($msg))) -replace '-','').ToLower()
Invoke-RestMethod -Uri "http://localhost:4000/zoom/webhook" -Method Post -ContentType "application/json" `
  -Headers @{ "x-zm-signature" = $sig; "x-zm-request-timestamp" = $ts } -Body $body
```
Expected: `{"received":true}`, a `recordings` row + `recording_files` row, one
`share_links` row, and **no duplicates** when you send the same body again.

### Test 3 — Real Zoom recording **[MANUAL]**
Record a short Zoom cloud meeting, let it finish processing, and confirm:
the webhook arrives, the recording shows in `/admin`, a share link can be
created, and the public `/watch/<token>` page plays the recording after the
attendee enters their name. Verify an expired link shows the expired screen.

---

## 9. Quick API reference

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| POST | `/zoom/webhook` | Zoom signature | CRC + `recording.completed` |
| GET | `/health` | none | health/DB probe |
| GET | `/admin/session` | access code | verify admin code |
| GET | `/admin/recordings` | access code | list recordings |
| GET | `/admin/recordings/:id` | access code | recording details |
| POST | `/admin/recordings/:id/share-links` | access code | create/regenerate link |
| GET | `/public/share-links/:token` | valid token | sanitized recording data |
| POST | `/public/share-links/:token/access` | valid token | log attendee access |

Admin auth: send the code as `x-admin-access-code: <code>` (or
`Authorization: Bearer <code>`).
