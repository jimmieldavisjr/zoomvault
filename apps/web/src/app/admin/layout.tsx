import type { Metadata } from "next";

import { AdminAuthProvider } from "@/components/admin/admin-auth";

export const metadata: Metadata = {
  title: "Admin — ZoomVault",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
