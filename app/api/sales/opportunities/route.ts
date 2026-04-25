import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        const opportunities = await prisma.opportunity.findMany({
            where: {
                isDelete: false,
                ...(companyId && companyId !== 'all' ? { customer: { companyId } } : {})
            },
            include: {
                customer: true,
                categories: true,
                paymentType: true,
                zone: true,
                status: true,
                incharge: {
                    select: { id: true, email: true, profileName: true, username: true, image: true }
                },
                histories: {
                    include: { status: true },
                    orderBy: { startDate: 'desc' }
                },
                comments: {
                    orderBy: { createdDate: 'desc' }
                }
            },
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(opportunities);
    } catch (error: any) {
        console.error("Opportunity GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const user = session?.user?.name || "System";
        const body = await req.json();

        // Ensure date is valid DateTime
        const dateObj = new Date(body.date);

        // Calculate custom Opp Number (DDMMYYNNN)
        const startOfDay = new Date(dateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setHours(23, 59, 59, 999);

        // Count ALL opportunities (including soft-deleted) created on this specific date to act as the daily sequence.
        // This ensures if a record is deleted, its sequence number won't be reused for that date.
        const countToday = await prisma.opportunity.count({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yy = String(dateObj.getFullYear()).slice(-2);
        const sequence = String(countToday + 1).padStart(3, '0');
        const oppNumber = `${dd}${mm}${yy}${sequence}`;

        const parsedCustomer = parseInt(body.customerId);
        const parsedPayment = parseInt(body.paymentTypeId);
        const parsedZone = parseInt(body.zoneId);
        const parsedStatus = parseInt(body.statusId);
        const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id)) : [];

        if (isNaN(parsedCustomer) || categoryIds.length === 0 || isNaN(parsedPayment) || isNaN(parsedZone) || isNaN(parsedStatus) || !body.inchargeId) {
            return NextResponse.json({ error: "Please ensure all dropdowns (Customer, Category, Payment, Zone, Status, Account Manager) are actively selected." }, { status: 400 });
        }

        const newOpportunity = await prisma.$transaction(async (tx) => {
            const opp = await tx.opportunity.create({
                data: {
                    oppNumber,
                    date: dateObj,
                    opportunityName: body.opportunityName,
                    customer: { connect: { slno: parsedCustomer } },
                    value: parseFloat(body.value) || 0,
                    paymentType: { connect: { slno: parsedPayment } },
                    zone: { connect: { slno: parsedZone } },
                    status: { connect: { slno: parsedStatus } },
                    incharge: { connect: { id: body.inchargeId } },
                    remarks: body.remarks || null,
                    categories: {
                        connect: categoryIds.map((id: number) => ({ slno: id }))
                    }
                }
            });

            // Create initial history
            await tx.opportunityStatusHistory.create({
                data: {
                    opportunityId: opp.id,
                    statusId: opp.statusId,
                    startDate: dateObj,
                }
            });

            // Order Fulfillment Trigger Logic for Immediate Wins
            const selectedStatus = await tx.statusMaster.findUnique({
                where: { slno: parsedStatus }
            });

            if (selectedStatus && selectedStatus.statusName.toLowerCase().includes('win')) {
                const now = new Date();
                const d = String(now.getDate()).padStart(2, '0');
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const y = String(now.getFullYear());
                const prefix = `${d}${m}${y}`;

                const lastOrder = await tx.order.findFirst({
                    where: { orderNo: { startsWith: prefix } },
                    orderBy: { orderNo: 'desc' }
                });

                let runningNo = 1;
                if (lastOrder && lastOrder.orderNo.length >= 11) {
                    const lastRunningStr = lastOrder.orderNo.slice(-3);
                    const parsed = parseInt(lastRunningStr, 10);
                    if (!isNaN(parsed)) runningNo = parsed + 1;
                }

                const orderNo = `${prefix}${String(runningNo).padStart(3, '0')}`;

                await tx.order.create({
                    data: {
                        orderNo,
                        opportunityId: opp.id,
                        date: now,
                        createdBy: user,
                        updatedBy: user
                    }
                });
            }

            return opp;
        });

        return NextResponse.json(newOpportunity);
    } catch (error: any) {
        console.error("Opportunity POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        const user = session?.user?.name || "System";
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Opportunity ID required" }, { status: 400 });
        }

        const existing = await prisma.opportunity.findUnique({
            where: { id: body.id },
            include: { histories: true }
        });

        if (!existing) {
            return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
        }

        const newStatusId = parseInt(body.statusId);
        let statusName = "";

        if (existing.statusId !== newStatusId) {
            const nextStatusObj = await prisma.statusMaster.findUnique({ where: { slno: newStatusId } });
            statusName = nextStatusObj?.statusName || "Unknown Stage";
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Check if status changed
            if (existing.statusId !== newStatusId) {
                // Find open history
                const activeHistory = existing.histories.find(h => !h.endDate);
                if (activeHistory) {
                    const endDate = new Date();
                    const daysSpent = Math.max(1, Math.ceil((endDate.getTime() - activeHistory.startDate.getTime()) / (1000 * 3600 * 24)));
                    await tx.opportunityStatusHistory.update({
                        where: { id: activeHistory.id },
                        data: { endDate, daysSpent }
                    });
                }

                // Create new history
                await tx.opportunityStatusHistory.create({
                    data: {
                        opportunityId: existing.id,
                        statusId: newStatusId,
                        startDate: new Date(),
                    }
                });

                // Auto inject status comment if applicable
                if (body.statusRemarks) {
                    await tx.opportunityComment.create({
                        data: {
                            opportunityId: existing.id,
                            comment: `[Stage Updated to ${statusName}]: ${body.statusRemarks}`,
                            createdBy: user
                        }
                    });
                }
            }

            const dateObj = body.date ? new Date(body.date) : existing.date;

            // Sync the lead stage date with the overall opportunity date if it changed
            if (existing.date.getTime() !== dateObj.getTime()) {
                const sorted = [...existing.histories].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
                if (sorted.length > 0) {
                    await tx.opportunityStatusHistory.update({
                        where: { id: sorted[0].id },
                        data: { startDate: dateObj }
                    });
                }
            }

            const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id)) : [];

            const updatedOpp = await tx.opportunity.update({
                where: { id: existing.id },
                data: {
                    date: dateObj,
                    opportunityName: body.opportunityName,
                    customer: { connect: { slno: parseInt(body.customerId) } },
                    value: parseFloat(body.value),
                    paymentType: { connect: { slno: parseInt(body.paymentTypeId) } },
                    zone: { connect: { slno: parseInt(body.zoneId) } },
                    status: { connect: { slno: newStatusId } },
                    incharge: { connect: { id: body.inchargeId } },
                    remarks: body.remarks || null,
                    categories: {
                        set: categoryIds.map((id: number) => ({ slno: id }))
                    }
                }
            });

            // Order Fulfillment Trigger Logic
            const selectedStatus = await tx.statusMaster.findUnique({
                where: { slno: newStatusId }
            });

            if (selectedStatus && selectedStatus.statusName.toLowerCase().includes('win')) {
                const existingOrder = await tx.order.findUnique({
                    where: { opportunityId: updatedOpp.id }
                });

                if (!existingOrder) {
                    const now = new Date();
                    const d = String(now.getDate()).padStart(2, '0');
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    const y = String(now.getFullYear());
                    const prefix = `${d}${m}${y}`;

                    const lastOrder = await tx.order.findFirst({
                        where: { orderNo: { startsWith: prefix } },
                        orderBy: { orderNo: 'desc' }
                    });

                    let runningNo = 1;
                    if (lastOrder && lastOrder.orderNo.length >= 11) {
                        const lastRunningStr = lastOrder.orderNo.slice(-3);
                        const parsed = parseInt(lastRunningStr, 10);
                        if (!isNaN(parsed)) runningNo = parsed + 1;
                    }

                    const orderNo = `${prefix}${String(runningNo).padStart(3, '0')}`;

                    await tx.order.create({
                        data: {
                            orderNo,
                            opportunityId: updatedOpp.id,
                            date: now,
                            createdBy: user,
                            updatedBy: user
                        }
                    });
                }
            }

            return updatedOpp;
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Opportunity PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        await prisma.opportunity.update({
            where: { id },
            data: { isDelete: true }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Opportunity DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
