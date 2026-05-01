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
        if (request.nextUrl.pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Unauthorized", redirect: "/login?timeout=true" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login?timeout=true", request.url));
    }

    // Verify token identity strictly
    const parsed = await decrypt(sessionValue);
    if (!parsed || (parsed.expires && new Date(parsed.expires).getTime() < Date.now())) {
        const response = request.nextUrl.pathname.startsWith("/api") 
            ? NextResponse.json({ error: "Session Expired", redirect: "/login?timeout=true" }, { status: 401 })
            : NextResponse.redirect(new URL("/login?timeout=true", request.url));
        response.cookies.delete("session");
        return response;
    }

    // Force password change for temporary passwords
    if (parsed.user?.isTempPassword && path !== "/change-password" && !path.startsWith("/api/auth")) {
        if (request.nextUrl.pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Password change required", redirect: "/change-password" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/change-password", request.url));
    }

    const response = await updateSession(request) || NextResponse.next();
    
    // Add no-store cache control to prevent back-button showing cached authenticated pages after logout
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    
    return response;
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
