import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ unread: 0 }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        const currentUserId = dbUser.id;

        const count = await prisma.message.count({
            where: {
                receiverId: currentUserId,
                readStatus: false
            }
        });

        return NextResponse.json({ unread: count });
    } catch (error: any) {
        console.error("GET Chat Unread Error:", error);
        return NextResponse.json({ unread: 0 }, { status: 500 });
    }
}
