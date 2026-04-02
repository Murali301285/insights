import { NextRequest } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const sessionValue = request.cookies.get("session")?.value;
    const path = request.nextUrl.pathname;

    // Public Routes (Login, Static Assets)
    if (path.startsWith("/login") || path.startsWith("/api/auth") || path.startsWith("/api/setup") || path.startsWith("/_next") || path.includes(".")) {
        if (sessionValue) return await updateSession(request);
        return NextResponse.next();
    }

    // Protected Routes
    if (!sessionValue) {
        return NextResponse.redirect(new URL("/login?timeout=true", request.url));
    }

    // Verify token identity strictly
    const parsed = await decrypt(sessionValue);
    if (!parsed || (parsed.expires && new Date(parsed.expires).getTime() < Date.now())) {
        const response = NextResponse.redirect(new URL("/login?timeout=true", request.url));
        response.cookies.delete("session");
        return response;
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
