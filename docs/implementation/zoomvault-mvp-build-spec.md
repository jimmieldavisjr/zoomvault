# ZoomVault Build Mode Implementation Plan

## Project Objective

Build the first functional version of ZoomVault: a lightweight recording access portal that receives Zoom cloud recording completion webhooks, stores recording metadata, generates temporary share links, and provides a public viewer page where attendees can access recordings without creating an account.

The system should use Zoom as the recording storage/playback provider. The application should manage metadata, access control, expiring links, attendee name capture, admin visibility, and email notifications.

## Current Completed Work

The Zoom Developer App has already been created.

The production webhook subscription has been configured for Zoom recording completion events.

The backend currently has a Zoom webhook endpoint using:

```http
POST /zoom/webhook
```

Production webhook URL:

```text
https://api.zoomvault.jdtechpartners.com/zoom/webhook
```

The CRC URL validation flow has been tested successfully from PowerShell. The endpoint correctly returns:

```json
{
  "plainToken": "...",
  "encryptedToken": "..."
}
```

The Zoom webhook secret token has been added as a backend environment variable:

```env
ZOOM_WEBHOOK_SECRET_TOKEN=...
```

Do not expose Zoom secrets in frontend code, logs, screenshots, or committed files.

## Important Route Decision

Keep the existing Zoom webhook route as:

```http
POST /zoom/webhook
```

Do not change it to `/zoom/webhooks` unless all Zoom dashboard configuration and backend routes are updated together.

## Immediate Build Goal

Start from the backend foundation. Implement database persistence and the recording workflow before building out the full frontend.

The first working flow should be:

```text
Zoom recording completed
→ Zoom sends webhook to API
→ API verifies the webhook
→ API extracts recording metadata
→ API stores recording metadata in the database
→ API generates a secure temporary share link
→ API optionally sends/admin-prepares a notification
→ Public viewer page can load recording data by token
```

## Stack Assumptions

Backend:

```text
NestJS
PostgreSQL
Railway
TypeScript
```

Frontend:

```text
Next.js
TypeScript
Vercel
Tailwind/shadcn if already installed
```

Email:

```text
Resend
```

Database:

```text
PostgreSQL
```

## Environment Variables

Backend environment variables should include:

```env
DATABASE_URL=
ZOOM_WEBHOOK_SECRET_TOKEN=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
RESEND_API_KEY=
APP_PUBLIC_URL=
API_PUBLIC_URL=
ADMIN_ACCESS_CODE=
DEFAULT_LINK_EXPIRATION_DAYS=14
```

Use Railway variables for production. Do not commit real secrets.

## Phase 1 — Database Foundation

Create the initial database schema for recordings, share links, and access logs.

### recordings table

Purpose: stores Zoom recording metadata received from the webhook.

Suggested fields:

```text
id
zoom_meeting_id
zoom_meeting_uuid
zoom_account_id
host_id
topic
start_time
end_time
duration_minutes
recording_count
raw_payload_json
created_at
updated_at
```

### recording_files table

Purpose: stores individual Zoom recording files.

Suggested fields:

```text
id
recording_id
zoom_file_id
file_type
file_extension
file_size
recording_type
play_url
download_url
status
recording_start
recording_end
created_at
updated_at
```

### share_links table

Purpose: stores secure temporary links for public recording access.

Suggested fields:

```text
id
recording_id
token_hash
expires_at
is_active
created_at
updated_at
```

Store only a hash of the token if practical. The raw token should only be shown/generated once.

### access_logs table

Purpose: stores viewer access records.

Suggested fields:

```text
id
share_link_id
recording_id
attendee_name
ip_address
user_agent
accessed_at
```

## Phase 2 — Backend Modules

Create the following NestJS modules under the API app.

### Zoom Module

Existing purpose: receive Zoom webhook events.

Responsibilities:

```text
Handle endpoint.url_validation
Verify Zoom signatures
Handle recording.completed
Route recording.completed payload to RecordingsService
Return quickly with 200/201 after successful receipt
```

The Zoom module should not contain all database logic directly. It should delegate recording persistence to the Recordings module.

### Recordings Module

Responsibilities:

```text
Create recording entity/model
Store Zoom recording metadata
Store Zoom recording files
Prevent duplicate recordings if Zoom retries webhook delivery
Fetch recordings for admin views
Fetch recording by share token for public viewer
```

Important: Zoom may resend webhook events, so the recording insert should be idempotent. Use meeting UUID, meeting ID, or Zoom file IDs to prevent duplicates.

### Share Links Module

Responsibilities:

```text
Generate secure random share tokens
Hash and store tokens
Create expiration timestamps
Validate active links
Reject expired links
Reject disabled links
Return recording data for valid tokens
```

Default expiration should use:

```env
DEFAULT_LINK_EXPIRATION_DAYS=14
```

### Email Module

Responsibilities:

```text
Integrate Resend
Create recording-ready email template
Send admin notification when a new recording is available
```

For MVP, email can initially notify the admin only. Attendee recipient management can come later.

### Admin Module

Responsibilities:

```text
Admin access code authentication
List recordings
View recording details
Manually create/regenerate share links
Health check endpoint
```

Keep authentication simple for MVP using an admin access code. Do not overbuild full user authentication yet.

## Phase 3 — API Endpoints

Implement these backend endpoints.

### Zoom webhook

```http
POST /zoom/webhook
```

Responsibilities:

```text
CRC validation
Signature verification
recording.completed handling
```

### Health check

```http
GET /health
```

Returns:

```json
{
  "status": "ok"
}
```

### Admin recordings list

```http
GET /admin/recordings
```

Protected by admin access code.

### Admin recording details

```http
GET /admin/recordings/:id
```

Protected by admin access code.

### Create share link

```http
POST /admin/recordings/:id/share-links
```

Protected by admin access code.

### Public recording lookup

```http
GET /public/share-links/:token
```

Returns recording metadata and playable recording file information only if the token is valid and not expired.

### Access log submission

```http
POST /public/share-links/:token/access
```

Captures attendee name and access metadata.

## Phase 4 — Frontend Pages

Build the frontend after the backend endpoints exist.

### Public pages

Create:

```text
Landing page
Recording viewer page
Attendee name form
Expired link page
Error page
Access denied page
```

### Recording viewer page

The viewer page should:

```text
Load recording by token
Show recording topic
Show recording date
Show duration
Ask attendee for name before viewing
Submit attendee name to access log endpoint
Embed or link to Zoom playback
Show transcript section as placeholder for now
Show resources section as placeholder for now
```

The attendee should not need an account.

### Admin pages

Create:

```text
Admin login page
Recordings list page
Recording details page
Share link management area
```

## Phase 5 — Security Requirements

Implement the following security basics:

```text
Verify Zoom webhook signatures
Keep Zoom and Resend secrets backend-only
Use secure random share tokens
Hash share tokens before storing if practical
Check link expiration before showing recording data
Protect admin endpoints
Do not expose download URLs unless intentionally allowed
Disable recording downloads in Zoom settings when possible
Avoid logging full webhook secrets, tokens, or private URLs
```

## Phase 6 — Testing Workflow

### Test 1 — CRC validation

Already tested successfully with:

```text
endpoint.url_validation
```

Keep this working.

### Test 2 — Mock recording.completed webhook

Use a local or terminal-generated request to simulate:

```text
recording.completed
```

Expected result:

```text
API verifies signature
API accepts event
Recording metadata is stored
Recording files are stored
Share link is generated
No duplicate rows on repeated event
```

### Test 3 — Real Zoom webhook delivery

Create a short Zoom cloud recording and allow it to finish processing.

Expected result:

```text
Zoom sends production webhook
API receives event
Database contains recording
Admin can see recording
Share link can be created
Public viewer can load the recording
```

## Build Order

Work in this order:

1. Confirm current Zoom webhook route and signature verification.
2. Configure database connection.
3. Create database schema/migrations.
4. Create Recordings module.
5. Persist `recording.completed` webhook data.
6. Add idempotency protection.
7. Create Share Links module.
8. Add public token validation endpoint.
9. Add access logging.
10. Add Resend email module.
11. Build minimal admin endpoints.
12. Build public frontend recording viewer.
13. Build admin frontend.
14. Run real Zoom recording test.

## Definition of Done for First MVP

The MVP is complete when:

```text
A real Zoom cloud recording completes
Zoom sends the webhook to production API
The API verifies the event
Recording metadata is saved to PostgreSQL
A temporary share link can be generated
A public viewer can open the link
The viewer enters their name
The system logs the access
The viewer can watch the Zoom-hosted recording
Expired links are rejected
Admin can see the recording in a basic list
```

## Do Not Overbuild Yet

Avoid these for the first MVP:

```text
Full user accounts
Complex permissions
Payment system
Custom video hosting
S3 video storage
Transcript automation
Advanced analytics
Multi-tenant organization logic
Complex admin dashboards
```

Focus on the simplest reliable recording-to-link workflow first.
