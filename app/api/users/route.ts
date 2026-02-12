import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: { company: true }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession(); // Get admin session for audit logging

    try {
        const body = await req.json();
        const { email, password, username, profileName, role, isBlocked, companyId } = body;

        // Basic Validation
        if (!email || !password || !username || !profileName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                profileName,
                role: role || "user",
                isBlocked: isBlocked || false,
                companyId: companyId || null
            },
        });

        if (session) {
            await logAction({
                action: "CREATE_USER",
                entity: "User",
                entityId: user.id,
                details: { createdUserEmail: email, createdBy: session.user.email, companyId },
                userId: session.user.id,
                userEmail: session.user.email
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        if (session) {
            await logAction({
                action: "CREATE_USER_FAILED",
                entity: "User",
                details: { error: String(error) },
                userId: session.user.id,
                userEmail: session.user.email
            });
        }
        return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }
}
