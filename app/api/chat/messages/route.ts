import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const contactId = url.searchParams.get("userId");

        if (!contactId) {
            return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        const currentUserId = dbUser.id;

        // Fetch messages between these two users
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: contactId },
                    { senderId: contactId, receiverId: currentUserId }
                ]
            },
            include: {
                sender: { select: { id: true, profileName: true, email: true } },
                receiver: { select: { id: true, profileName: true, email: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Mark messages as read if the current user is the receiver and they were unread
        const unreadMessageIds = messages
            .filter(m => m.receiverId === currentUserId && !m.readStatus)
            .map(m => m.id);

        if (unreadMessageIds.length > 0) {
            await prisma.message.updateMany({
                where: { id: { in: unreadMessageIds } },
                data: { readStatus: true }
            });
            // Update the objects locally to return accurate live state
            messages.forEach(m => {
                if (unreadMessageIds.includes(m.id)) m.readStatus = true;
            });
        }

        return NextResponse.json(messages);
    } catch (error: any) {
        console.error("GET Chat Messages Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        const currentUserId = dbUser.id;
        
        // Next.js handles body parsing natively
        // However, Next.js sets a base 4MB limit. Since the user requested 5MB limit max
        // If a file exceeds Next.js boundaries, it throws 413 Payload Too Large natively before reaching here.
        // We will do a generic soft check on length just in case our Next config allows larger.
        
        const bodyContent = await req.text();
        const sizeInMB = Buffer.byteLength(bodyContent, 'utf8') / (1024 * 1024);
        
        if (sizeInMB > 5.5) {
            return NextResponse.json({ error: "Payload exceeds 5MB size limit." }, { status: 413 });
        }
        
        const body = JSON.parse(bodyContent);
        const { receiverId, content, attachment } = body;

        if (!receiverId) {
            return NextResponse.json({ error: "Receiver required" }, { status: 400 });
        }
        if (!content && !attachment) {
            return NextResponse.json({ error: "Content or attachment required" }, { status: 400 });
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId: currentUserId,
                receiverId,
                content: content || null,
                attachment: attachment || null,
                readStatus: false
            },
            include: {
                sender: { select: { id: true, profileName: true, email: true } },
                receiver: { select: { id: true, profileName: true, email: true } }
            }
        });

        return NextResponse.json(newMessage);
    } catch (error: any) {
        console.error("POST Chat Message Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
