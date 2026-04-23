import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatClient } from "./ChatClient";
import { prisma } from "@/lib/prisma";

export default async function MessagesPage() {
    const session = await getSession();
    if (!session?.user) redirect('/login');

    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser) redirect('/login');

    return (
        <div className="h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <ChatClient currentUser={{ id: dbUser.id, name: dbUser.profileName || dbUser.email, email: dbUser.email }} />
        </div>
    );
}
