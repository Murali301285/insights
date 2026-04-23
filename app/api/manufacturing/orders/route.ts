import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        const orders = await prisma.order.findMany({
            where: {
                ...(companyId && companyId !== 'all' ? { opportunity: { customer: { companyId: { in: companyId.split(',') } } } } : {})
            },
            include: {
                opportunity: {
                    include: { customer: { include: { company: true } }, categories: true }
                },
                currentStage: true,
                history: {
                    include: { stage: true },
                    orderBy: { startDate: 'desc' }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Compute elapsed days dynamically
        const result = orders.map(order => {
            const today = new Date();
            let totalElapsed = 0;

            if (order.date) {
                totalElapsed = Math.max(0, Math.ceil((today.getTime() - new Date(order.date).getTime()) / (1000 * 3600 * 24)));
            }

            return {
                ...order,
                elapsedDays: totalElapsed
            };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Order GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        const user = session?.user?.name || "System";
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 });
        }

        const existing = await prisma.order.findUnique({
            where: { id: body.id },
            include: { history: true }
        });

        if (!existing) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const newStageId = body.currentStageId ? parseInt(body.currentStageId) : null;

        const updated = await prisma.$transaction(async (tx) => {
            if (newStageId && existing.currentStageId !== newStageId) {
                // Find open history and close it
                const activeHistory = existing.history.find(h => !h.endDate);
                if (activeHistory) {
                    await tx.orderHistory.update({
                        where: { id: activeHistory.id },
                        data: { endDate: new Date() }
                    });
                }

                // Create new open history
                await tx.orderHistory.create({
                    data: {
                        orderId: existing.id,
                        stageId: newStageId,
                        startDate: new Date(),
                        enteredBy: user,
                        remarks: body.remarks || null,
                        attachments: body.attachments || null
                    }
                });
            } else if (newStageId && !existing.currentStageId) {
                // Initial stage setting
                await tx.orderHistory.create({
                    data: {
                        orderId: existing.id,
                        stageId: newStageId,
                        startDate: existing.date || new Date(),
                        enteredBy: user,
                        remarks: body.remarks || null,
                        attachments: body.attachments || null
                    }
                });
            } else if (newStageId && existing.currentStageId === newStageId && (body.remarks || body.attachments)) {
                // Append remarks/attachments to the currently active stage history without advancing
                const activeHistory = existing.history.find(h => !h.endDate && h.stageId === newStageId);
                if (activeHistory) {
                    await tx.orderHistory.update({
                        where: { id: activeHistory.id },
                        data: {
                            remarks: body.remarks ? (activeHistory.remarks ? activeHistory.remarks + '\n\n' + body.remarks : body.remarks) : activeHistory.remarks,
                            attachments: body.attachments || activeHistory.attachments
                        }
                    });
                }
            }

            const updateData: any = {
                orderIncharge: body.orderIncharge !== undefined ? body.orderIncharge : existing.orderIncharge,
                targetDate: body.targetDate === undefined ? undefined : (body.targetDate ? new Date(body.targetDate) : null),
                updatedBy: user,
            };
            if (body.currentStageId !== undefined) {
                updateData.currentStageId = newStageId;
            }
            
            if (body.orderValue !== undefined) {
                updateData.orderValue = body.orderValue === '' || body.orderValue === null ? null : parseFloat(body.orderValue);
            }

            if (body.isClosed !== undefined) updateData.isClosed = body.isClosed;
            if (body.closeReason !== undefined) updateData.closeReason = body.closeReason;
            if (body.closeAttachments !== undefined) updateData.closeAttachments = body.closeAttachments;

            return await tx.order.update({
                where: { id: existing.id },
                data: updateData
            });
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Order PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
