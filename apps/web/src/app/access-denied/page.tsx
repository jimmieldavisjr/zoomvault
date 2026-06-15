import type { Metadata } from "next";

import { StatusScreen } from "@/components/status-screen";

export const metadata: Metadata = {
  title: "Access denied — ZoomVault",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return <StatusScreen kind="denied" />;
}
