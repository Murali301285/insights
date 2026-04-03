import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: { isBlocked: false },
            select: { id: true, email: true, profileName: true, username: true, image: true, role: true }
        });
        return NextResponse.json(users);
    } catch (error: any) {
        console.error("User GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
