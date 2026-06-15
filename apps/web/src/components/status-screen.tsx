import Link from "next/link";
import { CalendarX2, Lock, SearchX, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";

export type StatusKind = "expired" | "denied" | "not_found" | "error";

const STATUS_CONFIG: Record<
  StatusKind,
  { icon: typeof CalendarX2; title: string; description: string }
> = {
  expired: {
    icon: CalendarX2,
    title: "This link has expired",
    description:
      "Recording links are only available for a limited time. Please contact the person who shared this recording to request renewed access.",
  },
  denied: {
    icon: Lock,
    title: "Access unavailable",
    description:
      "This share link has been disabled and can no longer be used to view the recording.",
  },
  not_found: {
    icon: SearchX,
    title: "Recording not found",
    description:
      "We couldn't find a recording for this link. Double-check the URL, or ask the sender for an updated link.",
  },
  error: {
    icon: TriangleAlert,
    title: "Something went wrong",
    description:
      "We couldn't load this recording right now. Please try again in a few moments.",
  },
};

export function StatusScreen({ kind }: { kind: StatusKind }) {
  const { icon: Icon, title, description } = STATUS_CONFIG[kind];

  return (
    <PageShell contentClassName="items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Icon className="size-6" />
          </span>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mx-auto max-w-sm text-pretty">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
