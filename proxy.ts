import { NextResponse, type NextRequest } from "next/server";
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

  let profileFullName: string | null = null;

  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("full_name, role, status")
      .eq("id", userId)
      .maybeSingle();

    if (!error && profile?.role === "staff" && profile.status === "active") {
      profileFullName = profile.full_name;
    }
  } catch {
    profileFullName = null;
  }

  if (!profileFullName) {
    return preserveSessionCookies(
      response,
      NextResponse.redirect(new URL("/auth/login", request.url)),
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-staff-full-name");
  requestHeaders.set(
    "x-staff-full-name",
    encodeURIComponent(profileFullName),
  );
  const authorizedResponse = preserveSessionCookies(
    response,
    NextResponse.next({ request: { headers: requestHeaders } }),
  );

  return authorizedResponse;
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
