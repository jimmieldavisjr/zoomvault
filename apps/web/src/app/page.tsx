import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Link2,
  Lock,
  Mail,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Zoom-native storage",
    description:
      "Recordings stay in Zoom for storage and playback — no duplicate files or extra infrastructure to manage.",
  },
  {
    icon: Link2,
    title: "Expiring share links",
    description:
      "Generate secure, temporary links that automatically expire so recordings are never exposed longer than needed.",
  },
  {
    icon: Users,
    title: "Attendee access tracking",
    description:
      "See exactly who opened a recording and when, with a clear audit trail for every shared link.",
  },
  {
    icon: BarChart3,
    title: "Recording metadata",
    description:
      "Surface titles, durations, dates, and host details so viewers always have the context they need.",
  },
  {
    icon: Mail,
    title: "Automated notifications",
    description:
      "Send share invitations and reminders automatically via email — no manual follow-up required.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "Scoped, revocable links keep sensitive meetings protected without slowing down legitimate access.",
  },
];

const stack = ["Next.js", "NestJS", "PostgreSQL", "TypeScript"];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Lock className="size-4" />
            </span>
            ZoomVault
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/recordings">
                Open portal
                <ArrowRight />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <div className="flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <ShieldCheck />
            Secure recording sharing
          </Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Share Zoom cloud recordings through secure, temporary links
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            ZoomVault is a lightweight web portal that uses Zoom for video storage and playback
            while adding recording metadata, attendee access tracking, expiring share links, and
            automated email notifications.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/recordings">
                Get started
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Explore features</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to share recordings safely
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            Built around Zoom&apos;s cloud, ZoomVault adds the access controls and visibility that
            teams expect from a modern sharing portal.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="h-full">
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <Card className="bg-muted/40">
          <CardContent className="flex flex-col items-start gap-6 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Built on a modern, type-safe stack</CardTitle>
              <CardDescription className="mt-1">
                A reliable foundation for secure, maintainable recording workflows.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {stack.map((label) => (
                <Badge key={label} variant="outline" className="h-7 px-3 text-sm">
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            ZoomVault — temporary links, lasting control
          </div>
          <p>© {new Date().getFullYear()} ZoomVault</p>
        </div>
      </footer>
    </main>
  );
}
