import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname, searchParams } = req.nextUrl;

  const isAuthPage = pathname === "/signin" || pathname === "/signup";

  if (isAuthPage) {
    return token
      ? NextResponse.redirect(new URL("/dashboard", req.url))
      : NextResponse.next();
  }

  // Everything else the matcher lets through is protected
  if (!token) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("callbackUrl", pathname + searchParams);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/funds/:path*",
    "/p2ptransfer/:path*",
    "/payment-success/:path*",
    "/onboarding/:path*",
    "/signin",
    "/signup",
  ],
};

// `/verify-email` intentionally left open
// It should remain publicly accessible (do not block logged-in or
// logged-out users from /verify-email since a user might click the
// email link while logged in or out)
