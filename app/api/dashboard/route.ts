import { NextResponse } from "next/server";

import { getActiveMembershipContext } from "@/services/auth";
import { getDashboardSnapshot } from "@/services/dashboard";

export async function GET() {
  const membership = await getActiveMembershipContext();

  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getDashboardSnapshot(membership);
  return NextResponse.json(snapshot);
}
