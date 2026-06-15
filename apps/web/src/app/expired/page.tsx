import type { Metadata } from "next";

import { StatusScreen } from "@/components/status-screen";

export const metadata: Metadata = {
  title: "Link expired — ZoomVault",
  robots: { index: false, follow: false },
};

export default function ExpiredPage() {
  return <StatusScreen kind="expired" />;
}
