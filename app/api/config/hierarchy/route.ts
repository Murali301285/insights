import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
        return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    try {
        const nodes = await prisma.hierarchyNode.findMany({
            where: { companyId },
            orderBy: { order: 'asc' } // or createdAt
        });
        return NextResponse.json(nodes);
    } catch (error) {
        console.error("Error fetching hierarchy:", error);
        return NextResponse.json({ error: "Failed to fetch hierarchy" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Admin only? (Assuming admins can edit config)
    // if (session.user.role !== 'admin') ...

    try {
        const body = await req.json();
        const { companyId, title, name, email, phone, location, photo, parentId, order } = body;

        if (!companyId || !title) {
            return NextResponse.json({ error: "Company ID and Title are required" }, { status: 400 });
        }

        const newNode = await prisma.hierarchyNode.create({
            data: {
                companyId,
                title,
                name,
                email,
                phone,
                location,
                photo,
                parentId: parentId || null,
                order: order || 0
            }
        });

        return NextResponse.json(newNode);
    } catch (error) {
        console.error("Error creating hierarchy node:", error);
        return NextResponse.json({ error: "Failed to create node" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
        }

        const updatedNode = await prisma.hierarchyNode.update({
            where: { id },
            data: updates
        });

        return NextResponse.json(updatedNode);
    } catch (error) {
        console.error("Error updating hierarchy node:", error);
        return NextResponse.json({ error: "Failed to update node" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
    }

    try {
        await prisma.hierarchyNode.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting hierarchy node:", error);
        return NextResponse.json({ error: "Failed to delete node" }, { status: 500 });
    }
}
