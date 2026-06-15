/**
 * Admin API client. Every call carries the shared admin access code in the
 * `x-admin-access-code` header (MVP auth — no user accounts yet).
 *
 * These run in the browser from the admin pages; the code is held in
 * sessionStorage only, never persisted server-side here.
 */
import { API_BASE_URL } from "./api";

export interface AdminRecordingCounts {
  files: number;
  shareLinks: number;
  accessLogs: number;
}

export interface AdminRecordingListItem {
  id: string;
  topic: string | null;
  zoomMeetingId: string;
  startTime: string | null;
  durationMinutes: number | null;
  createdAt: string;
  _count: AdminRecordingCounts;
}

export interface AdminRecordingFile {
  id: string;
  fileType: string | null;
  fileExtension: string | null;
  // BigInt is serialized as a string by the API.
  fileSize: string | null;
  recordingType: string | null;
  playUrl: string | null;
  downloadUrl: string | null;
  status: string | null;
  recordingStart: string | null;
  recordingEnd: string | null;
}

export interface AdminShareLink {
  id: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAccessLog {
  id: string;
  attendeeName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  accessedAt: string;
}

export interface AdminRecordingDetail extends AdminRecordingListItem {
  endTime: string | null;
  hostId: string | null;
  recordingCount: number | null;
  files: AdminRecordingFile[];
  shareLinks: AdminShareLink[];
  accessLogs: AdminAccessLog[];
}

export interface CreatedShareLink {
  id: string;
  url: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function authHeaders(code: string): HeadersInit {
  return { "x-admin-access-code": code };
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new AdminApiError(401, "Invalid admin access code.");
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, `Request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

/** Verifies a code against the protected session endpoint. */
export async function verifyAdminCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/session`, {
      headers: authHeaders(code),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listRecordings(
  code: string,
): Promise<AdminRecordingListItem[]> {
  const res = await fetch(`${API_BASE_URL}/admin/recordings`, {
    headers: authHeaders(code),
    cache: "no-store",
  });
  return handle<AdminRecordingListItem[]>(res);
}

export async function getRecording(
  code: string,
  id: string,
): Promise<AdminRecordingDetail> {
  const res = await fetch(
    `${API_BASE_URL}/admin/recordings/${encodeURIComponent(id)}`,
    { headers: authHeaders(code), cache: "no-store" },
  );
  return handle<AdminRecordingDetail>(res);
}

export async function createShareLink(
  code: string,
  recordingId: string,
  expirationDays?: number,
): Promise<CreatedShareLink> {
  const res = await fetch(
    `${API_BASE_URL}/admin/recordings/${encodeURIComponent(recordingId)}/share-links`,
    {
      method: "POST",
      headers: { ...authHeaders(code), "Content-Type": "application/json" },
      body: JSON.stringify(expirationDays ? { expirationDays } : {}),
    },
  );
  return handle<CreatedShareLink>(res);
}
