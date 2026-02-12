import { NextRequest } from "next/server";
import { updateSession, getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    // 1. Update session expiration if active
    // await updateSession(request);

    // 2. Protect Routes
    const session = request.cookies.get("session")?.value;
    const path = request.nextUrl.pathname;

    // Public Routes (Login, Static Assets)
    if (path.startsWith("/login") || path.startsWith("/api/auth") || path.startsWith("/api/setup") || path.startsWith("/_next") || path.includes(".")) {
        return await updateSession(request);
    }

    // Protected Routes
    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return await updateSession(request);
}

export const config = {
    matcher: [
        // Match all paths except:
        // - api/auth (auth apis)
        // - _next/static (static files)
        // - _next/image (image optimization files)
        // - favicon.ico (favicon file)
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
