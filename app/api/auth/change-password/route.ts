import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession, updateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        const isPlainMatch = currentPassword === user.password;

        if (!isValid && !isPlainMatch) {
            return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                isTempPassword: false
            }
        });

        // Re-issue a new session with isTempPassword = false
        const { encrypt } = await import('@/lib/auth');
        const maxAge = 30 * 60; // 30 Minutes
        const expires = new Date(Date.now() + maxAge * 1000);
        
        const newPayload = { ...session.user, isTempPassword: false };
        const newSession = await encrypt({ user: newPayload, expires });
        
        const res = NextResponse.json({ success: true });
        res.cookies.set("session", newSession, { maxAge, expires, httpOnly: true, sameSite: "lax" });
        return res;
        
    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}
