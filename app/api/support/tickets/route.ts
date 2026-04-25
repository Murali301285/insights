import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const type = searchParams.get('type') || 'INTERNAL';

        if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

        // @ts-ignore
        const tickets = await prisma.supportTicket.findMany({
            where: { companyId, type },
            include: { incharge: true, order: { include: { opportunity: { include: { customer: true } } } }, opportunity: { include: { customer: true, status: true, incharge: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const mappedTickets = tickets.map((t: any) => {
            if (t.incharge) {
                t.incharge.name = t.incharge.profileName || (t.incharge.firstName && t.incharge.lastName ? `${t.incharge.firstName} ${t.incharge.lastName}`.trim() : null) || t.incharge.username || t.incharge.email;
            }
            if (t.opportunity?.incharge) {
                t.opportunity.incharge.name = t.opportunity.incharge.profileName || (t.opportunity.incharge.firstName && t.opportunity.incharge.lastName ? `${t.opportunity.incharge.firstName} ${t.opportunity.incharge.lastName}`.trim() : null) || t.opportunity.incharge.username || t.opportunity.incharge.email;
            }
            return t;
        });

        return NextResponse.json(mappedTickets);
    } catch (error) {
        console.error("SupportTicket GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = String(now.getFullYear());
        const datePrefix = `${d}${m}${y}`;

        // @ts-ignore
        const lastTicket = await prisma.supportTicket.findFirst({
            where: { companyId: body.companyId, ticketNo: { startsWith: datePrefix } },
            orderBy: { createdAt: 'desc' }
        });

        let running = 1;
        if (lastTicket) {
            const numPart = lastTicket.ticketNo.split('_')[0].slice(8);
            const parsed = parseInt(numPart);
            if (!isNaN(parsed)) running = parsed + 1;
        }

        const ticketNo = `${datePrefix}${String(running).padStart(3, '0')}_${body.type.toLowerCase()}`;

        // @ts-ignore
        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNo,
                companyId: body.companyId,
                type: body.type,
                date: new Date(body.date || new Date()),
                details: body.details,
                targetDate: body.targetDate ? new Date(body.targetDate) : null,
                actualDays: body.actualDays ? parseInt(body.actualDays) : null,
                inchargeId: body.inchargeId || null,
                orderId: body.orderId || null,
                opportunityId: body.opportunityId || null,
                status: body.status || "OPEN",
                comments: body.comments || [],
                attachments: body.attachments || [],
                createdBy: session.user.name || "System",
                updatedBy: session.user.name || "System"
            }
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("SupportTicket POST Error:", error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        // @ts-ignore
        const existing = await prisma.supportTicket.findUnique({
            where: { id: body.id }
        });

        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updateData: any = {
            updatedBy: session.user.name || "System"
        };
        
        if (body.details !== undefined) updateData.details = body.details;
        if (body.targetDate !== undefined) updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
        if (body.actualDays !== undefined) updateData.actualDays = body.actualDays ? parseInt(body.actualDays) : null;
        if (body.inchargeId !== undefined) updateData.inchargeId = body.inchargeId || null;
        if (body.orderId !== undefined) updateData.orderId = body.orderId || null;
        if (body.opportunityId !== undefined) updateData.opportunityId = body.opportunityId || null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.isClosed !== undefined) updateData.isClosed = body.isClosed;
        if (body.closeReason !== undefined) updateData.closeReason = body.closeReason;
        if (body.closeAttachments !== undefined) updateData.closeAttachments = body.closeAttachments;
        if (body.comments !== undefined) updateData.comments = body.comments;
        if (body.attachments !== undefined) updateData.attachments = body.attachments;

        // @ts-ignore
        const updated = await prisma.supportTicket.update({
            where: { id: body.id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("SupportTicket PUT Error:", error);
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        // @ts-ignore
        await prisma.supportTicket.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("SupportTicket DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
    }
}
