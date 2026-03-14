"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardSnapshot } from "@/types/dashboard";

async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch("/api/dashboard", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load dashboard snapshot.");
  }

  return response.json();
}

export function useDashboardSnapshot(initialData: DashboardSnapshot) {
  return useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: fetchDashboardSnapshot,
    initialData,
  });
}
