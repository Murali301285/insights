import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: { companies: true }
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
        const { email, password, username, profileName, role, isBlocked, companyIds, hasGlobalAccess } = body;

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
                hasGlobalAccess: hasGlobalAccess || false,
                companies: companyIds?.length > 0 ? { connect: companyIds.map((id: string) => ({ id })) } : undefined
            },
        });

        if (session) {
            await logAction({
                action: "CREATE_USER",
                entity: "User",
                entityId: user.id,
                details: { createdUserEmail: email, createdBy: session.user.email, companyIds, hasGlobalAccess },
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

export async function PUT(req: NextRequest) {
    const session = await getSession();

    try {
        const body = await req.json();
        const { id, email, password, username, profileName, role, isBlocked, companyIds, hasGlobalAccess } = body;

        if (!id) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

        const dataToUpdate: any = {
            email,
            username,
            profileName,
            role,
            isBlocked,
            hasGlobalAccess: hasGlobalAccess || false,
        };

        if (companyIds) {
            dataToUpdate.companies = { set: companyIds.map((id: string) => ({ id })) };
        } else if (hasGlobalAccess) {
            dataToUpdate.companies = { set: [] };
        }

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });

        if (session) {
            await logAction({
                action: "UPDATE_USER",
                entity: "User",
                entityId: updated.id,
                details: { updatedUserEmail: email, updatedBy: session.user.email, companyIds, hasGlobalAccess },
                userId: session.user.id,
                userEmail: session.user.email
            });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("PUT User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

        await prisma.user.delete({ where: { id } });

        if (session) {
            await logAction({
                action: "DELETE_USER",
                entity: "User",
                entityId: id,
                details: { deletedBy: session.user.email },
                userId: session.user.id,
                userEmail: session.user.email
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
    }
}
