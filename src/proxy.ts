import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

const ROLE_REDIRECTS: Record<UserRole, string> = {
  ADMIN: "/admin",
  EMPLOYEE: "/agency",
  CLIENT: "/client",
};

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;

  // Allow public paths
  if (
    path.startsWith("/api/auth") ||
    path.startsWith("/api/webhooks") ||
    path.startsWith("/api/cron") ||
    path === "/login"
  ) {
    return NextResponse.next();
  }

  // Not logged in → redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role as UserRole;

  // Root redirect
  if (path === "/") {
    return NextResponse.redirect(new URL(ROLE_REDIRECTS[role], req.url));
  }

  // Role-based access control
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(ROLE_REDIRECTS[role], req.url));
  }

  if (path.startsWith("/agency") && !["ADMIN", "EMPLOYEE"].includes(role)) {
    return NextResponse.redirect(new URL(ROLE_REDIRECTS[role], req.url));
  }

  if (path.startsWith("/client") && role !== "CLIENT") {
    return NextResponse.redirect(new URL(ROLE_REDIRECTS[role], req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
