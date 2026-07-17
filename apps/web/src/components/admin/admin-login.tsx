"use client";

import { useState } from "react";
import { KeyRound, Lock } from "lucide-react";

import { verifyAdminCode } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AdminLogin({
  onAuthenticated,
}: {
  onAuthenticated: (code: string) => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const code = value.trim();
    if (!code) {
      setError("Enter the admin access code to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const ok = await verifyAdminCode(code);
      if (!ok) {
        setError("That access code wasn't accepted. Please try again.");
        return;
      }
      onAuthenticated(code);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="logo-gradient mx-auto mb-2 flex size-11 items-center justify-center rounded-full text-white">
            <Lock className="size-5" />
          </span>
          <CardTitle className="text-xl">ZoomVault Admin</CardTitle>
          <CardDescription>
            Enter your admin access code to manage recordings and share links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-code">Access code</Label>
              <Input
                id="admin-code"
                type="password"
                autoComplete="off"
                placeholder="••••••••"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(error)}
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Access denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Checking…" : "Continue"}
              {!submitting && <KeyRound />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
