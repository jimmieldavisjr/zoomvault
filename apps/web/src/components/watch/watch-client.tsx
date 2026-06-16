"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  Paperclip,
  Play,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { PublicRecording } from "@/lib/api";
import { submitAttendeeAccess } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WatchClient({
  token,
  recording,
}: {
  token: string;
  recording: PublicRecording;
}) {
  const [name, setName] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `zoomvault:viewer:${token}`;

  // Returning viewers who already entered their name skip the gate.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(storageKey)) {
      setUnlocked(true);
    }
  }, [storageKey]);

  const title = recording.topic?.trim() || "Zoom recording";
  const dateLabel = formatDate(recording.startTime);
  const primaryFile =
    recording.files.find((f) => f.fileType?.toUpperCase() === "MP4") ??
    recording.files[0];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("Please enter your name to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const ok = await submitAttendeeAccess(token, trimmed);
      if (!ok) {
        setError("We couldn't verify access to this recording. Please retry.");
        return;
      }
      window.sessionStorage.setItem(storageKey, trimmed);
      setUnlocked(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <ShieldCheck />
          Secure recording
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {dateLabel && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {dateLabel}
            </span>
          )}
          {recording.durationMinutes != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {recording.durationMinutes} min
            </span>
          )}
        </div>
      </div>

      {!unlocked ? (
        <Card className="w-full">
          <CardHeader>
            <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <UserRound className="size-4.5" />
            </span>
            <CardTitle>Enter your name to watch</CardTitle>
            <CardDescription>
              No account needed. We record your name so the host knows who
              viewed the recording.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendee-name">Your name</Label>
                <Input
                  id="attendee-name"
                  name="attendee-name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={name}
                  maxLength={200}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(error)}
                  autoFocus
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "Verifying…" : "Watch recording"}
                {!submitting && <Play />}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="aspect-video w-full bg-muted">
              {primaryFile?.playUrl ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-background shadow-sm">
                    <Play className="size-8" />
                  </span>
                  <div>
                    <p className="font-semibold">This recording is hosted on Zoom</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Click below to watch it in a new tab.
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <a
                      href={primaryFile.playUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Watch Recording
                      <ExternalLink />
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No playable recording file is available.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Transcript
              </CardTitle>
              <CardDescription>
                Transcripts will appear here when available from Zoom.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="size-4" />
                Resources
              </CardTitle>
              <CardDescription>
                Supporting files and links shared for this session will appear
                here.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
