import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
    let emailForLog = "";
    try {
        console.log("LOGIN: Request received");
        const body = await request.json();
        console.log("LOGIN: Body parsed");
        const { email, password } = body;
        emailForLog = email;

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        // Find User
        const user = await prisma.user.findFirst({ 
            where: { 
                email: {
                    equals: email,
                    mode: "insensitive"
                }
            },
            include: { role: true }
        });
        if (!user) {
            await logAction({
                action: "LOGIN_FAILED",
                entity: "User",
                details: { reason: "User not found", email },
                userEmail: email
            });
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify Password
        const isValid = await bcrypt.compare(password, user.password);
        const isPlainMatch = password === user.password;

        if (!isValid && !isPlainMatch) {
            await logAction({
                action: "LOGIN_FAILED",
                entity: "User",
                details: { reason: "Invalid password", email },
                userEmail: email
            });
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Check Block Status
        if (user.isBlocked) {
            await logAction({
                action: "LOGIN_BLOCKED",
                entity: "User",
                entityId: user.id,
                details: { reason: "Account blocked", email },
                userId: user.id,
                userEmail: email
            });
            return NextResponse.json({ error: "User is blocked for login. Contact admin." }, { status: 403 });
        }

        // Create Session
        await login({
            id: user.id,
            email: user.email,
            name: user.profileName || user.username || "User",
            image: user.image || "",
            role: user.role?.name || "user",
            roleId: user.roleId || "",
        });

        await logAction({
            action: "LOGIN_SUCCESS",
            entity: "User",
            entityId: user.id,
            userId: user.id,
            userEmail: user.email
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        await logAction({
            action: "LOGIN_ERROR",
            entity: "System",
            details: { error: String(error), email: emailForLog }
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
