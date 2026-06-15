import type { Metadata } from "next";

import { fetchPublicRecording } from "@/lib/api";
import { PageShell } from "@/components/page-shell";
import { StatusScreen } from "@/components/status-screen";
import { WatchClient } from "@/components/watch/watch-client";

export const metadata: Metadata = {
  title: "Watch recording — ZoomVault",
  robots: { index: false, follow: false },
};

export default async function WatchPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchPublicRecording(token);

  if (result.status !== "ok") {
    return <StatusScreen kind={result.status} />;
  }

  return (
    <PageShell>
      <WatchClient token={token} recording={result.recording} />
    </PageShell>
  );
}
