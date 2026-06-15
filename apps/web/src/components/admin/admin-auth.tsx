"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { Lock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminLogin } from "@/components/admin/admin-login";

const STORAGE_KEY = "zoomvault:admin-code";

interface AdminAuthValue {
  code: string;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

/** Access the verified admin code + sign-out from within protected pages. */
export function useAdmin(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminAuthProvider.");
  }
  return ctx;
}

/**
 * Gates all admin pages behind the shared access code. The verified code lives
 * in sessionStorage (cleared when the tab closes), never in a cookie or
 * localStorage, to keep the MVP auth footprint small.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCode(window.sessionStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  const handleAuthenticated = useCallback((value: string) => {
    window.sessionStorage.setItem(STORAGE_KEY, value);
    setCode(value);
  }, []);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setCode(null);
  }, []);

  // Avoid a flash of the login form before sessionStorage is read.
  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!code) {
    return <AdminLogin onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AdminAuthContext.Provider value={{ code, signOut }}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
            <Link
              href="/admin"
              className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Lock className="size-4" />
              </span>
              <span className="truncate">ZoomVault Admin</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </AdminAuthContext.Provider>
  );
}
