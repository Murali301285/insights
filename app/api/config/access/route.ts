import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const roleId = url.searchParams.get("roleId");

        if (!roleId) return NextResponse.json({ error: "Missing roleId" }, { status: 400 });

        const accesses = await prisma.roleAccess.findMany({
            where: { roleId },
            include: { page: true }
        });

        return NextResponse.json(accesses);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch access matrix" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { roleId, accesses } = body; 
        // accesses should be an array: { pageId, canView, canAdd, canEdit, canDelete }

        if (!roleId || !Array.isArray(accesses)) {
            return NextResponse.json({ error: "Missing required payload" }, { status: 400 });
        }

        // We run a massive transaction to upsert all combinations
        const transactions = accesses.map((acc: any) => {
            return prisma.roleAccess.upsert({
                where: {
                    roleId_pageId: {
                        roleId,
                        pageId: acc.pageId
                    }
                },
                update: {
                    canView: acc.canView,
                    canAdd: acc.canAdd,
                    canEdit: acc.canEdit,
                    canDelete: acc.canDelete
                },
                create: {
                    roleId,
                    pageId: acc.pageId,
                    canView: acc.canView,
                    canAdd: acc.canAdd,
                    canEdit: acc.canEdit,
                    canDelete: acc.canDelete
                }
            });
        });

        await prisma.$transaction(transactions);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("PUT Access Error:", error);
        return NextResponse.json({ error: "Failed to save access matrix." }, { status: 500 });
    }
}
