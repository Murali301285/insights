import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get("companyId");

        const statuses = await prisma.requestStageMaster.findMany({
            where: {
                isDelete: false,
                ...(companyId ? { companyId } : {})
            },
            include: { company: true },
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(statuses);
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

        if (body.slno) {
            const updated = await prisma.requestStageMaster.update({
                where: { slno: body.slno },
                data: {
                    statusName: body.statusName,
                    order: orderInt,
                    remarks: body.remarks,
                    isActive: body.isActive,
                    companyId: body.companyId || null,
                    updatedBy: user
                }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.requestStageMaster.create({
                data: {
                    statusName: body.statusName,
                    order: orderInt,
                    remarks: body.remarks,
                    isActive: body.isActive,
                    companyId: body.companyId || null,
                    createdBy: user
                }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error("Request Stage Master Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "A stage with this Name or Order number already exists in this context." }, { status: 400 });
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

        await prisma.requestStageMaster.update({
            where: { slno: parseInt(slno) },
            data: { isDelete: true, isActive: false, updatedBy: user }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
