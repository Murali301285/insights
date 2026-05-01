import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const roleId = url.searchParams.get("roleId");

        if (!roleId) return NextResponse.json({ error: "Missing roleId" }, { status: 400 });

        const accesses = await prisma.roleAccess.findMany({
            where: { roleId }
        });

        return NextResponse.json(accesses);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch accesses" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { roleId, accesses } = body;

        if (!roleId || !accesses) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // We delete all existing accesses for this role to overwrite with the new ones.
        await prisma.roleAccess.deleteMany({
            where: { roleId }
        });

        const newAccesses = Object.keys(accesses)
            .filter(pageId => accesses[pageId])
            .map(pageId => ({
                roleId,
                pageId,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
            }));

        if (newAccesses.length > 0) {
            await prisma.roleAccess.createMany({
                data: newAccesses
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving role access", error);
        return NextResponse.json({ error: "Failed to save accesses" }, { status: 500 });
    }
}
