import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/env";

export async function GET() {
  try {
    getClientEnv();
    return NextResponse.json(
      {
        ok: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "misconfigured",
        message: error instanceof Error ? error.message : "Invalid environment configuration.",
      },
      { status: 500 },
    );
  }
}
