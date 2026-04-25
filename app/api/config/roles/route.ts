import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const companyId = url.searchParams.get("companyId");

        const roles = await prisma.role.findMany({
            where: {
                ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {})
            },
            include: { company: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, remarks, isActive, companyId } = body;

        if (!name) {
            return NextResponse.json({ error: "Role name is required" }, { status: 400 });
        }

        const role = await prisma.role.create({
            data: {
                name,
                remarks,
                isActive: isActive !== undefined ? isActive : true,
                companyId: companyId || null
            }
        });

        return NextResponse.json(role);
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: "Role name must be unique" }, { status: 400 });
        return NextResponse.json({ error: "Failed to create role." }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, remarks, isActive, companyId } = body;

        if (!id) return NextResponse.json({ error: "Missing role ID" }, { status: 400 });

        const updated = await prisma.role.update({
            where: { id },
            data: { name, remarks, isActive, companyId: companyId || null }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to update role." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing role ID" }, { status: 400 });

        // Prisma restricts delete if users are connected, assuming normal constraint fails or cascade.
        // We shouldn't cascade users to delete. So if it fails, it's trapped.
        await prisma.role.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Cannot delete role. It may still be assigned to users." }, { status: 500 });
    }
}
