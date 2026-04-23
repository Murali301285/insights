import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) return NextResponse.json({ error: "Missing company ID" }, { status: 400 });

        // @ts-ignore
        const requests = await prisma.supplyRequest.findMany({
            where: { companyId },
            include: { 
                incharge: true, 
                order: { include: { opportunity: { include: { customer: true } } } }, 
                opportunity: { include: { customer: true, status: true, incharge: true } },
                stage: true,
                supplier: true
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("SupplyRequest GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
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
        const y = String(now.getFullYear()).slice(-2);
        const datePrefix = `REQ-${d}${m}${y}`;

        // @ts-ignore
        const lastReq = await prisma.supplyRequest.findFirst({
            where: { companyId: body.companyId, requestNo: { startsWith: datePrefix } },
            orderBy: { requestNo: 'desc' }
        });

        let running = 1;
        if (lastReq) {
            const parts = lastReq.requestNo.split('-');
            if (parts.length === 3) {
                const parsed = parseInt(parts[2]);
                if (!isNaN(parsed)) running = parsed + 1;
            }
        }

        const requestNo = `${datePrefix}-${String(running).padStart(3, '0')}`;

        // @ts-ignore
        const request = await prisma.supplyRequest.create({
            data: {
                requestNo,
                companyId: body.companyId,
                type: body.type,
                date: new Date(body.date || new Date()),
                details: body.details,
                targetDate: body.targetDate ? new Date(body.targetDate) : null,
                actualDays: body.actualDays ? parseInt(body.actualDays) : null,
                inchargeId: body.inchargeId || null,
                orderId: body.orderId || null,
                opportunityId: body.opportunityId || null,
                supplierSlno: body.supplierSlno ? parseInt(body.supplierSlno) : null,
                status: body.status || "OPEN"
            }
        });

        return NextResponse.json(request);
    } catch (error) {
        console.error("SupplyRequest POST Error:", error);
        return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        if (body.stageSlno) {
            // Processing a stage tracking update
            const stageSlno = parseInt(body.stageSlno);
            // @ts-ignore
            const stage = await prisma.requestStageMaster.findUnique({ where: { slno: stageSlno } });
            if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 400 });

            // @ts-ignore
            const existing = await prisma.supplyRequest.findUnique({ where: { id: body.requestId } });
            
            const newHistoryItem = {
                stageSlno: stage.slno,
                stageName: stage.statusName,
                order: stage.order,
                date: new Date().toISOString(),
                remarks: body.remarks || '',
                attachments: body.attachments || [],
                updatedBy: session.user.name || 'System'
            };

            const history = Array.isArray(existing.stageHistory) ? existing.stageHistory : [];

            // @ts-ignore
            const updated = await prisma.supplyRequest.update({
                where: { id: body.requestId },
                data: {
                    currentStageSlno: stage.slno,
                    stageHistory: [...history, newHistoryItem]
                },
                include: { stage: true }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: "Bad Request" }, { status: 400 });

    } catch (error) {
        console.error("SupplyRequest PUT Error:", error);
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }
}
