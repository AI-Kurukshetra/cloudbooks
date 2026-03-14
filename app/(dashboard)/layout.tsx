import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireActiveMembership } from "@/services/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireActiveMembership();
  return <AppShell>{children}</AppShell>;
}
