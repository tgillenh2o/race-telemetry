import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("sb-access-token")?.value;

  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";

  // ❌ not logged in → force login
  if (!token && !isLogin && !isRegister) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ❌ logged in → block login page
  if (token && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
