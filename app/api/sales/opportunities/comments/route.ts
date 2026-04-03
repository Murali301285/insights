import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const user = session?.user?.profileName || session?.user?.name || session?.user?.email || "System User";
        const body = await req.json();

        if (!body.opportunityId || !body.comment) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const comment = await prisma.opportunityComment.create({
            data: {
                opportunityId: body.opportunityId,
                comment: body.comment,
                createdBy: user,
            }
        });

        return NextResponse.json(comment);
    } catch (error: any) {
        console.error("Opportunity Comment POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
