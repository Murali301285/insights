import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET_KEY || "your-secret-key-insight-app";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    // console.log("AUTH: Encrypting payload"); // Too verbose?
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch (error) {
        console.error("AUTH: Decrypt failed:", error);
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function login(userData: { id: string; email: string; name: string; image?: string; role: string; roleId?: string }) {
    const maxAge = 30 * 60; // 30 Minutes strict
    const expires = new Date(Date.now() + maxAge * 1000);
    const session = await encrypt({ user: userData, expires });

    const cookieStore = await cookies();
    cookieStore.set("session", session, { maxAge, expires, httpOnly: true, sameSite: "lax" });
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.set("session", "", { maxAge: 0, expires: new Date(0) });
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    // Refresh session expiration on activity
    const parsed = await decrypt(session);
    if (!parsed) return NextResponse.next(); // Do not crash, let middleware handle invalidation

    // Prevent token bloat by stripping previous JWT metadata
    const { iat, exp, ...cleanPayload } = parsed;

    const maxAge = 30 * 60; // 30 Minutes strict
    cleanPayload.expires = new Date(Date.now() + maxAge * 1000);

    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await encrypt(cleanPayload),
        httpOnly: true,
        maxAge: maxAge,
        expires: cleanPayload.expires,
    });

    return res;
}
