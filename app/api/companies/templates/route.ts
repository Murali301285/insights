import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) return NextResponse.json({ error: "Company ID required" }, { status: 400 });

    try {
        const templates = await prisma.documentTemplate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyId, name, docType, layoutConfig, isDefault } = body;

        // Check limit (max 10)
        const count = await prisma.documentTemplate.count({ where: { companyId } });
        if (count >= 10) {
            return NextResponse.json({ error: "Maximum 10 templates allowed" }, { status: 400 });
        }

        // If this is default, unset others of same docType
        if (isDefault) {
            await prisma.documentTemplate.updateMany({
                where: { companyId, docType },
                data: { isDefault: false }
            });
        }

        const template = await prisma.documentTemplate.create({
            data: { companyId, name, docType, layoutConfig, isDefault }
        });

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, docType, layoutConfig, isDefault, companyId } = body;

        if (isDefault) {
            await prisma.documentTemplate.updateMany({
                where: { companyId, docType, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const template = await prisma.documentTemplate.update({
            where: { id },
            data: { name, docType, layoutConfig, isDefault }
        });

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await prisma.documentTemplate.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }
}
