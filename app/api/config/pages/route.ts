import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const pages = await prisma.appPage.findMany({
            orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }]
        });
        return NextResponse.json(pages);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pageName, remarks, isActive, path, icon, parentId, orderIndex } = body;

        if (!pageName) {
            return NextResponse.json({ error: "Page name is required" }, { status: 400 });
        }

        const page = await prisma.appPage.create({
            data: {
                pageName,
                remarks,
                path,
                icon,
                parentId: parentId || null,
                orderIndex: Number(orderIndex) || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        // Whenever a page is made, we might want to attach it implicitly to Admin.
        // For safety, let's just create it and let them map it in Access UI.

        return NextResponse.json(page);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to create page." }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, pageName, remarks, isActive, path, icon, parentId, orderIndex } = body;

        if (!id) return NextResponse.json({ error: "Missing page ID" }, { status: 400 });

        const updated = await prisma.appPage.update({
            where: { id },
            data: { 
                pageName, 
                remarks, 
                path,
                icon,
                parentId: parentId || null,
                orderIndex: Number(orderIndex) || 0,
                isActive 
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to update page." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing page ID" }, { status: 400 });

        await prisma.appPage.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Cannot delete page." }, { status: 500 });
    }
}
