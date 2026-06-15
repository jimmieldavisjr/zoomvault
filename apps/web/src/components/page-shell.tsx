import Link from "next/link";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared chrome (brand header + footer) for the non-landing pages so the
 * viewer, status, and admin screens feel like one product.
 */
export function PageShell({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("flex min-h-full flex-1 flex-col", className)}>
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Lock className="size-4" />
            </span>
            <span className="truncate">ZoomVault</span>
          </Link>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14",
          contentClassName,
        )}
      >
        {children}
      </main>

      <footer className="mt-auto border-t">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground sm:px-6 sm:text-left">
          ZoomVault — temporary links, lasting control
        </div>
      </footer>
    </div>
  );
}
