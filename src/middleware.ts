
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {

  const isLoginPage =
    req.nextUrl.pathname === "/login";

  // Look for ANY Supabase auth cookie
  const hasSession =
    req.cookies
      .getAll()
      .some((cookie) =>
        cookie.name.includes("auth-token")
      );

  // NOT LOGGED IN
  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // ALREADY LOGGED IN
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/session/:path*", "/login"],
};

