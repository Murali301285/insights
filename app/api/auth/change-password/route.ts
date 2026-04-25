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

        // We should ideally update the session to remove the `isTempPassword` flag
        // However, middleware just verifies the current session, the next login will have the correct flag.
        // It's easiest to just force them to log in again or let the middleware allow them if we update the cookie.
        // Actually, we can just clear the session to force re-login for security.
        const res = NextResponse.json({ success: true });
        res.cookies.delete("session");
        return res;
        
    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}
