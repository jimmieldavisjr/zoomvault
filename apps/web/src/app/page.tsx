import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <Badge variant="secondary" className="mb-6">
          <ShieldCheck />
          Secure Zoom Recording Vault
        </Badge>

        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Welcome to ZoomVault
        </h1>

        <p className="mt-4 text-base text-muted-foreground text-pretty sm:text-lg">
          Share Zoom cloud recordings through secure, expiring links delivered
          straight to your inbox. No public uploads, no permanent exposure.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg">
            Get Started
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>
    </main>
  );
}
