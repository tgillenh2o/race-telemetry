
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token =
    req.cookies.get("sb-access-token");

  const isLoginPage =
    req.nextUrl.pathname.startsWith("/login");

  // NOT LOGGED IN
  if (!token && !isLoginPage) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // LOGGED IN
  if (token && isLoginPage) {
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/session/:path*",
    "/login",
  ],
};
