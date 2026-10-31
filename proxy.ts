import { NextResponse, type NextRequest } from "next/server";
import { getKidById } from "./app/_data/kids";
import { updateSession } from "./utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, supabase, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname === "/" || pathname === "/kids" || pathname.startsWith("/kids/");

  if (!isProtectedRoute) {
    return response;
  }

  if (!userId) {
    return preserveSessionCookies(
      response,
      NextResponse.redirect(new URL("/auth/login", request.url)),
    );
  }

  let isActiveStaff = false;

  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", userId)
      .maybeSingle();

    isActiveStaff =
      !error && profile?.role === "staff" && profile.status === "active";
  } catch {
    isActiveStaff = false;
  }

  if (!isActiveStaff) {
    return preserveSessionCookies(
      response,
      NextResponse.redirect(new URL("/auth/login", request.url)),
    );
  }

  if (pathname.startsWith("/kids/") && !getKidById(pathname.split("/")[2])) {
    return preserveSessionCookies(
      response,
      NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 }),
    );
  }

  return response;
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
