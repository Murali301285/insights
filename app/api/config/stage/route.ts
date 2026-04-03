import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get("companyId");

        const items = await prisma.stageMaster.findMany({
            where: {
                isDelete: false,
                ...(companyId ? { companyId } : {})
            },
            include: { company: true },
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(items);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession()
        const user = session?.user?.name || "System"
        const body = await req.json();

        const orderInt = parseInt(body.order);
        const percentageInt = parseInt(body.percentage) || 0;

        if (body.isActive) {
            const activeStages = await prisma.stageMaster.findMany({
                where: {
                    isDelete: false,
                    isActive: true,
                    companyId: body.companyId || null,
                    ...(body.slno ? { slno: { not: body.slno } } : {})
                }
            });

            const currentTotal = activeStages.reduce((sum, stage) => sum + (stage.percentage || 0), 0);
            if (currentTotal + percentageInt > 100) {
                return NextResponse.json({ error: `Cumulative percentage cannot exceed 100%. Current active total is ${currentTotal}%. You can only assign up to ${100 - currentTotal}%.` }, { status: 400 });
            }
        }

        if (body.slno) {
            const updated = await prisma.stageMaster.update({
                where: { slno: body.slno },
                data: {
                    stageName: body.stageName,
                    order: orderInt,
                    percentage: percentageInt,
                    remarks: body.remarks,
                    isActive: body.isActive,
                    companyId: body.companyId || null,
                    updatedBy: user
                }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.stageMaster.create({
                data: {
                    stageName: body.stageName,
                    order: orderInt,
                    percentage: percentageInt,
                    remarks: body.remarks,
                    isActive: body.isActive,
                    companyId: body.companyId || null,
                    createdBy: user
                }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error("Stage Master Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "A stage with this Name or Order number already exists." }, { status: 400 });
        }
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession()
        const user = session?.user?.name || "System"
        const { searchParams } = new URL(req.url);
        const slno = searchParams.get("slno");

        if (!slno) return NextResponse.json({ error: "Missing slno" }, { status: 400 });

        await prisma.stageMaster.update({
            where: { slno: parseInt(slno) },
            data: { isDelete: true, isActive: false, updatedBy: user }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
