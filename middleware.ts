import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;
  const reason = request.nextUrl.searchParams.get("reason");

  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasSessionCookie =
    request.cookies.has("sb-access-token") || request.cookies.getAll().some((cookie) => cookie.name.endsWith("-auth-token"));

  if (!hasSessionCookie && !isPublicPath && !pathname.startsWith("/api")) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSessionCookie && pathname === "/login" && reason !== "no-membership") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
