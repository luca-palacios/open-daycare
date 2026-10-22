import { NextResponse, type NextRequest } from "next/server";
import { getKidById } from "./app/_data/kids";

export function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/")[2];

  if (!getKidById(id)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/kids/:id",
};
