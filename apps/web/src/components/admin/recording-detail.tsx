"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Plus,
  Users,
} from "lucide-react";

import { useAdmin } from "@/components/admin/admin-auth";
import {
  AdminApiError,
  createShareLink,
  getRecording,
  type AdminRecordingDetail,
  type CreatedShareLink,
} from "@/lib/admin-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(value: string | null): string | null {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function isExpired(value: string): boolean {
  return new Date(value).getTime() <= Date.now();
}

export function RecordingDetail({ id }: { id: string }) {
  const { code, signOut } = useAdmin();
  const [recording, setRecording] = useState<AdminRecordingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getRecording(code, id);
      setRecording(data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof AdminApiError && err.status === 401) {
        signOut();
        return;
      }
      if (err instanceof AdminApiError && err.status === 404) {
        setError("This recording could not be found.");
        return;
      }
      setError("Couldn't load this recording. Please try again.");
    }
  }, [code, id, signOut]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateLink() {
    setCreating(true);
    setError(null);
    try {
      const link = await createShareLink(code, id);
      setCreated(link);
      setCopied(false);
      await load();
    } catch (err: unknown) {
      if (err instanceof AdminApiError && err.status === 401) {
        signOut();
        return;
      }
      setError("Couldn't create a share link. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. non-HTTPS); the URL is still shown.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2.5 mb-2">
          <Link href="/admin">
            <ArrowLeft />
            All recordings
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
          {recording?.topic?.trim() || "Recording"}
        </h1>
        {recording && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDate(recording.startTime)}
            </span>
            {recording.durationMinutes != null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {recording.durationMinutes} min
              </span>
            )}
            <span>Meeting ID: {recording.zoomMeetingId}</span>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!recording && !error && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {recording && (
        <>
          {created && (
            <Alert>
              <Check />
              <AlertTitle>Share link created</AlertTitle>
              <AlertDescription className="w-full">
                <p>
                  Copy this link now — for security the token is shown only
                  once.
                </p>
                <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
                  <Input readOnly value={created.url} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(created.url)}
                    className="shrink-0"
                  >
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4" />
                  Share links
                </CardTitle>
                <CardDescription>
                  Temporary links attendees use to watch this recording.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleCreateLink} disabled={creating}>
                <Plus />
                {creating ? "Creating…" : "Create link"}
              </Button>
            </CardHeader>
            <CardContent>
              {recording.shareLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No share links yet. Create one to share this recording.
                </p>
              ) : (
                <ul className="divide-y">
                  {recording.shareLinks.map((link) => {
                    const expired = isExpired(link.expiresAt);
                    const active = link.isActive && !expired;
                    return (
                      <li
                        key={link.id}
                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 text-sm"
                      >
                        <span className="text-muted-foreground">
                          Created {formatDate(link.createdAt)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            Expires {formatDate(link.expiresAt)}
                          </span>
                          <Badge
                            variant={active ? "secondary" : "outline"}
                            className={active ? "" : "text-muted-foreground"}
                          >
                            {expired
                              ? "Expired"
                              : link.isActive
                                ? "Active"
                                : "Disabled"}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Files</CardTitle>
              <CardDescription>
                Stored in Zoom cloud. Download links are admin-only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recording.files.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No files recorded for this meeting.
                </p>
              ) : (
                <ul className="divide-y">
                  {recording.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {file.recordingType ?? file.fileType ?? "Recording"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            file.fileType,
                            formatBytes(file.fileSize),
                            file.status,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {file.playUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={file.playUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Play
                              <ExternalLink />
                            </a>
                          </Button>
                        )}
                        {file.downloadUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={file.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Access log
              </CardTitle>
              <CardDescription>
                Who opened this recording and when.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recording.accessLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No views recorded yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {recording.accessLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 text-sm"
                    >
                      <span className="font-medium">
                        {log.attendeeName || "Anonymous"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(log.accessedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
