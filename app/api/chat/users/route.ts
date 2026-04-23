import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        
        const currentUserId = dbUser.id;

        // Fetch all active users (potentially filter out blocked users in future)
        const allUsers = await prisma.user.findMany({
            where: { isBlocked: false, id: { not: currentUserId } },
            select: { id: true, profileName: true, email: true, image: true, role: { select: { name: true } } }
        });

        // Fetch all messages involving the current user to calculate unread counts and latest messages
        const myMessages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        const enhancedUsers = allUsers.map(user => {
            // Find messages specifically with this peer
            const directMessages = myMessages.filter(m => 
                (m.senderId === user.id && m.receiverId === currentUserId) || 
                (m.senderId === currentUserId && m.receiverId === user.id)
            );

            // Compute unread count from this peer
            const unreadCount = directMessages.filter(m => m.senderId === user.id && m.receiverId === currentUserId && !m.readStatus).length;

            // Latest message 
            const latestMsg = directMessages.length > 0 ? directMessages[0] : null;

            return {
                ...user,
                unreadCount,
                latestMessage: latestMsg ? (latestMsg.content ? latestMsg.content.substring(0, 40) + (latestMsg.content.length > 40 ? '...' : '') : 'Attachment \ud83d\udcce') : null,
                latestMessageDate: latestMsg ? latestMsg.createdAt : null
            };
        });

        // Sort by users with whom we have recent messages, then alphabetically
        enhancedUsers.sort((a, b) => {
            if (a.latestMessageDate && b.latestMessageDate) {
                return (b.latestMessageDate as any).getTime() - (a.latestMessageDate as any).getTime();
            }
            if (a.latestMessageDate) return -1;
            if (b.latestMessageDate) return 1;
            
            const nameA = a.profileName || a.email;
            const nameB = b.profileName || b.email;
            return nameA.localeCompare(nameB);
        });

        return NextResponse.json(enhancedUsers);
    } catch (error: any) {
        console.error("GET Chat Users Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
