import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get("fastbi_org_name")?.value;

  const protectedRoutes = ["/dataeng", "/dashboards"];

  if (protectedRoutes.some((route) => path.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dataeng/:path*", "/dashboards/:path*"],
};
