```ts id="u1z4ho"
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {

  const hasSupabaseCookie =
    req.cookies
      .getAll()
      .some((cookie) =>
        cookie.name.startsWith("sb-")
      );

  const isLoginPage =
    req.nextUrl.pathname.startsWith("/login");

  // NOT LOGGED IN
  if (!hasSupabaseCookie && !isLoginPage) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // LOGGED IN
  if (hasSupabaseCookie && isLoginPage) {
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
```
