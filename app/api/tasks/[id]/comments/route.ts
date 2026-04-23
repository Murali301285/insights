import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const taskId = resolvedParams.id;
        const comments = await prisma.taskComment.findMany({
            where: { taskId },
            include: {
                createdBy: { select: { profileName: true, email: true, image: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(comments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { comment, attachments } = body;

        if (!comment) {
            return NextResponse.json({ error: "Comment text required" }, { status: 400 });
        }

        const resolvedParams = await params;
        const taskId = resolvedParams.id;
        
        const newComment = await prisma.taskComment.create({
            data: {
                taskId,
                comment,
                attachments: attachments || null,
                createdById: dbUser.id
            },
            include: {
                createdBy: { select: { profileName: true, email: true, image: true } }
            }
        });

        return NextResponse.json(newComment);
    } catch (error: any) {
        console.error("POST TaskComment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
