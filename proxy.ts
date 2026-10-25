import { NextResponse, type NextRequest } from "next/server";
import { getKidById } from "./app/_data/kids";
import { DEMO_SESSION_COOKIE, isDemoSessionValue } from "./app/_lib/demo-session";

const AUTH_ROUTES = new Set(["/login", "/activate-account"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasDemoSession = isDemoSessionValue(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
  );

  if (AUTH_ROUTES.has(pathname)) {
    if (hasDemoSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!hasDemoSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/kids/") && !getKidById(pathname.split("/")[2])) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/kids/:path*", "/login", "/activate-account"],
};
