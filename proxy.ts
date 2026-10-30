import { NextResponse, type NextRequest } from "next/server";
import { getKidById } from "./app/_data/kids";
import { DEMO_SESSION_COOKIE, isDemoSessionValue } from "./app/_lib/demo-session";
import { updateSession } from "./utils/supabase/proxy";

const AUTH_ROUTES = new Set(["/auth/login", "/auth/activate-account"]);

export async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const { pathname } = request.nextUrl;
  const hasDemoSession = isDemoSessionValue(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
  );

  if (AUTH_ROUTES.has(pathname)) {
    if (hasDemoSession) {
      return preserveSessionCookies(
        supabaseResponse,
        NextResponse.redirect(new URL("/", request.url)),
      );
    }

    return supabaseResponse;
  }

  if (!hasDemoSession) {
    return preserveSessionCookies(
      supabaseResponse,
      NextResponse.redirect(new URL("/auth/login", request.url)),
    );
  }

  if (pathname.startsWith("/kids/") && !getKidById(pathname.split("/")[2])) {
    return preserveSessionCookies(
      supabaseResponse,
      NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 }),
    );
  }

  return supabaseResponse;
}

function preserveSessionCookies(
  source: NextResponse,
  response: NextResponse,
) {
  source.cookies.getAll().forEach(({ name, value, ...options }) =>
    response.cookies.set(name, value, options),
  );

  for (const name of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(name);

    if (value) {
      response.headers.set(name, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/kids/:path*",
    "/auth/login",
    "/auth/activate-account",
  ],
};
