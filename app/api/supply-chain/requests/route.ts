import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get("companyId");

        if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

        const requests = await prisma.supplyRequest.findMany({
            where: { companyId },
            include: {
                incharge: { select: { id: true, profileName: true, username: true } },
                stage: true,
                company: { select: { id: true, name: true } },
                supplier: { select: { slno: true, supplierName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const user = session?.user?.name || "System";
        const body = await req.json();

        // Optional: auto-assign first stage?
        // For now let's just leave currentStageSlno null, it means it's unassigned/init stage.
        // Wait, better to assign perfectly. The UI will explicitly send a starting state if needed.

        // Generate RequestNo
        const count = await prisma.supplyRequest.count({
            where: { companyId: body.companyId }
        });
        const requestNo = `REQ-${(count + 1).toString().padStart(4, '0')}`;

        const created = await prisma.supplyRequest.create({
            data: {
                requestNo,
                companyId: body.companyId,
                date: new Date(body.date),
                details: body.details,
                targetDate: body.targetDate ? new Date(body.targetDate) : null,
                actualDays: body.actualDays ? parseInt(body.actualDays) : null,
                inchargeId: body.inchargeId || null,
                type: body.type || 'INTERNAL',
                orderId: body.orderId || null,
                supplierSlno: body.supplierSlno ? parseInt(body.supplierSlno) : null,
                createdBy: user,
                ...(body.stageSlno ? {
                    currentStageSlno: parseInt(body.stageSlno),
                    stageHistory: [{
                        stageSlno: parseInt(body.stageSlno),
                        remarks: "Request Created & Staged",
                        date: new Date(),
                        updatedBy: user
                    }]
                } : {})
            }
        });

        // Eagerly pull back stage details if available
        const populated = await prisma.supplyRequest.findUnique({
             where: { id: created.id },
             include: { stage: true }
        });

        return NextResponse.json(populated || created);
    } catch (error: any) {
        console.error("SupplyRequest Create Error:", error);
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        const user = session?.user?.name || "System";
        const body = await req.json();
        
        const { requestId, stageSlno, remarks, attachments } = body;

        const request = await prisma.supplyRequest.findUnique({
            where: { id: requestId },
            include: { stage: true }
        });

        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        const newStage = await prisma.requestStageMaster.findUnique({
            where: { slno: parseInt(stageSlno) }
        });

        if (!newStage) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

        if (request.stage && newStage.order <= request.stage.order) {
            return NextResponse.json({ error: "Cannot regress to a previous or same stage order. Forward only." }, { status: 400 });
        }

        // Prepare History Entry
        const historyEntry = {
            stageSlno: newStage.slno,
            stageName: newStage.statusName,
            order: newStage.order,
            date: new Date().toISOString(),
            remarks: remarks || "",
            attachments: attachments || [],
            updatedBy: user
        };

        const existingHistory = request.stageHistory ? (request.stageHistory as any[]) : [];
        const newHistory = [...existingHistory, historyEntry];

        const updated = await prisma.supplyRequest.update({
            where: { id: requestId },
            data: {
                currentStageSlno: newStage.slno,
                stageHistory: newHistory,
                updatedBy: user
            },
            include: { stage: true }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("SupplyRequest Update Error:", error);
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}
