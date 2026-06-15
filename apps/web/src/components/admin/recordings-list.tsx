"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Eye,
  Link2,
  Video,
} from "lucide-react";

import { useAdmin } from "@/components/admin/admin-auth";
import {
  AdminApiError,
  listRecordings,
  type AdminRecordingListItem,
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

export function RecordingsList() {
  const { code, signOut } = useAdmin();
  const [recordings, setRecordings] = useState<AdminRecordingListItem[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listRecordings(code)
      .then((data) => {
        if (active) setRecordings(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof AdminApiError && err.status === 401) {
          signOut();
          return;
        }
        setError("Couldn't load recordings. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [code, signOut]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Recordings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recordings captured from Zoom webhook events, newest first.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!recordings && !error && (
        <p className="text-sm text-muted-foreground">Loading recordings…</p>
      )}

      {recordings && recordings.length === 0 && (
        <Card>
          <CardHeader className="items-center text-center">
            <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Video className="size-5" />
            </span>
            <CardTitle className="text-lg">No recordings yet</CardTitle>
            <CardDescription className="mx-auto max-w-md">
              When a Zoom cloud recording finishes processing, it will appear
              here automatically via the webhook.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {recordings && recordings.length > 0 && (
        <div className="flex flex-col gap-3">
          {recordings.map((rec) => (
            <Card key={rec.id} size="sm">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {rec.topic?.trim() || "Untitled recording"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDate(rec.startTime)}
                    </span>
                    {rec.durationMinutes != null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {rec.durationMinutes} min
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Video className="size-3.5" />
                      {rec._count.files} files
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Link2 className="size-3.5" />
                      {rec._count.shareLinks} links
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="size-3.5" />
                      {rec._count.accessLogs} views
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {rec._count.shareLinks > 0 && (
                    <Badge variant="secondary">Shared</Badge>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/recordings/${rec.id}`}>
                      Manage
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
