import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const AUTH_PAGES = ["/login", "/register"];
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some((p) => 
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // 1. Root path (Landing Page) is always accessible
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 2. Unauthenticated user trying to access protected route
  if (!isPublic && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user trying to access auth pages (login/register)
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)",
  ],
};
