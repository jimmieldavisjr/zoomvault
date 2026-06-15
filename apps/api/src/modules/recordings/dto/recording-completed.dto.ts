import type { ZoomWebhookEvent } from '../../zoom/dto/zoom-webhook-event.dto';

/**
 * A single file Zoom produced for a cloud recording.
 *
 * @see https://developers.zoom.us/docs/api/webhooks/#recording-completed
 */
export interface ZoomRecordingFile {
  id: string;
  meeting_id?: string;
  recording_start?: string;
  recording_end?: string;
  file_type?: string;
  file_extension?: string;
  file_size?: number;
  /** Passcode-protected, Zoom-hosted playback page. Safe-ish for viewers. */
  play_url?: string;
  /** Direct download URL — backend only, never returned to public viewers. */
  download_url?: string;
  status?: string;
  recording_type?: string;
}

/** The `object` describing the meeting + its recording files. */
export interface ZoomRecordingObject {
  /** Numeric meeting id (Zoom sends this as a number). */
  id: number | string;
  /** Per-session UUID — used as our idempotency key. */
  uuid: string;
  account_id?: string;
  host_id?: string;
  topic?: string;
  start_time?: string;
  /** Duration in minutes. */
  duration?: number;
  recording_count?: number;
  recording_files?: ZoomRecordingFile[];
}

/** Payload wrapper for `recording.completed`. */
export interface ZoomRecordingCompletedPayload {
  account_id?: string;
  object: ZoomRecordingObject;
}

/**
 * Full `recording.completed` event. Zoom also includes a top-level
 * `download_token` used to authorize `download_url`s; we keep it backend-only.
 */
export type ZoomRecordingCompletedEvent =
  ZoomWebhookEvent<ZoomRecordingCompletedPayload> & {
    download_token?: string;
  };
