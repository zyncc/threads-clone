import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie && pathname !== "/signin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  if (sessionCookie && pathname === "/signin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
