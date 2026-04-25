import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const companyId = url.searchParams.get("companyId");

        const data = await prisma.paymentTypeMaster.findMany({
            where: {
                isDelete: false,
                ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {})
            },
            include: { company: true },
            orderBy: { slno: 'desc' }
        });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch payment types" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();

        const data = {
            paymentType: body.paymentType,
            remarks: body.remarks || null,
            isActive: body.isActive ?? true,
            companyId: body.companyId || null,
        };

        if (body.slno) {
            const updated = await prisma.paymentTypeMaster.update({
                where: { slno: body.slno },
                data: {
                    ...data,
                    updatedBy: session.user.username || session.user.email,
                }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.paymentTypeMaster.create({
                data: {
                    ...data,
                    createdBy: session.user.username || session.user.email,
                    updatedBy: session.user.username || session.user.email,
                }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') return NextResponse.json({ error: "Payment Type must be unique" }, { status: 400 });
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const url = new URL(request.url);
        const slno = url.searchParams.get("slno");
        if (!slno) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const deleted = await prisma.paymentTypeMaster.update({
            where: { slno: parseInt(slno) },
            data: {
                isDelete: true,
                updatedBy: session.user.username || session.user.email,
            }
        });
        return NextResponse.json(deleted);
    } catch (error) {
        return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
    }
}
