/**
 * Tiny client for the ZoomVault API.
 *
 * The base URL is configured via NEXT_PUBLIC_API_URL (see `.env.example`).
 * It must be public (NEXT_PUBLIC_) because the attendee viewer calls the API
 * directly from the browser.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export interface PublicRecordingFile {
  id: string;
  recordingType: string | null;
  fileType: string | null;
  playUrl: string | null;
}

export interface PublicRecording {
  topic: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  expiresAt: string;
  files: PublicRecordingFile[];
}

export type PublicRecordingResult =
  | { status: "ok"; recording: PublicRecording }
  | { status: "expired" }
  | { status: "denied" }
  | { status: "not_found" }
  | { status: "error" };

/**
 * Server-side fetch for the viewer page. Maps HTTP status to a discriminated
 * union so the page can render the correct screen (expired / denied / etc.).
 */
export async function fetchPublicRecording(
  token: string,
): Promise<PublicRecordingResult> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/share-links/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );

    if (res.ok) {
      const recording = (await res.json()) as PublicRecording;
      return { status: "ok", recording };
    }
    if (res.status === 410) return { status: "expired" };
    if (res.status === 403) return { status: "denied" };
    if (res.status === 404) return { status: "not_found" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

/** Submits an attendee access record. Returns true on success. */
export async function submitAttendeeAccess(
  token: string,
  attendeeName: string,
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE_URL}/public/share-links/${encodeURIComponent(token)}/access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendeeName }),
    },
  );
  return res.ok;
}
